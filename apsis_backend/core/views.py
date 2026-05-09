from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from .models import CustomUser, Location, Department, Profile, Product, ApsisRequest, RequestItem
from .serializers import UserSerializer, LocationSerializer, DepartmentSerializer, ProfileSerializer, ProductSerializer, ApsisRequestSerializer
from .tasks import send_apsis_notification
from . import services

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

class AdminOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if request.user.role == 'ADMIN':
            return True
            
        return False

class BaseViewSet(viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [AdminOnly()]
            
        return [permissions.IsAuthenticated()]

class UserViewSet(BaseViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        role = self.request.query_params.get('role')
        qs = self.queryset.all()
        
        if role:
            return qs.filter(role=role)
            
        return qs

class DepartmentViewSet(BaseViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class LocationViewSet(BaseViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

class ProfileViewSet(BaseViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

class ProductViewSet(BaseViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class ApsisRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ApsisRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        u = self.request.user
        qs = ApsisRequest.objects.select_related(
            'requester', 
            'beneficiary', 
            'technician', 
            'department', 
            'location', 
            'profile'
        ).prefetch_related('items__product').all()
        
        if u.role == 'REQUESTER':
            qs = qs.filter(requester=u)
        elif u.role == 'VIEWER':
            qs = qs.filter(status='COMPLETED')
        
        tech = self.request.query_params.get('technician')
        if tech:
            qs = qs.filter(technician_id=tech)
            
        status_f = self.request.query_params.get('status')
        if status_f:
            qs = qs.filter(status__in=status_f.split(','))
            
        return qs

    def perform_create(self, serializer):
        instance = serializer.save(requester=self.request.user)
        send_apsis_notification(instance.id, 'CREATED')

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        old_tech = serializer.instance.technician
        instance = serializer.save()
        if instance.technician and instance.technician != old_tech:
            send_apsis_notification(instance.id, 'ASSIGNED')
        if instance.status == 'COMPLETED' and old_status != 'COMPLETED':
            send_apsis_notification(instance.id, 'COMPLETED')

    @action(detail=False, methods=['post'], url_path='run-sla-check', permission_classes=[permissions.AllowAny])
    def run_sla_check(self, request):
        from .tasks import check_overdue_requests
        check_overdue_requests()
        return Response({'status': 'SLA check triggered'})

    @action(detail=True, methods=['patch'], url_path='items/(?P<item_id>[^/.]+)')
    def patch_item(self, request, pk=None, item_id=None):
        try:
            item = RequestItem.objects.get(id=item_id, request_id=pk)
            item.is_completed = request.data.get('is_completed', item.is_completed)
            item.save()
            return Response({'status': 'item updated'})
        except RequestItem.DoesNotExist:
            return Response(
                {'error': 'Item not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, F
        from django.utils import timezone
        from datetime import timedelta
        seven_days_ago = timezone.now() - timedelta(days=7)
        base_qs = ApsisRequest.objects.filter(created_at__gte=seven_days_ago)
        status_data = base_qs.values('status').annotate(count=Count('id'))
        dept_data = base_qs.values('department__name').annotate(count=Count('id')).order_by('-count')
        now = timezone.now()
        met_sla = base_qs.filter(status='COMPLETED', completed_at__lte=F('due_date')).count()
        missed_sla = base_qs.filter(status='COMPLETED', completed_at__gt=F('due_date')).count()
        ongoing_ontime = base_qs.exclude(status__in=['COMPLETED', 'REJECTED']).filter(due_date__gte=now).count()
        ongoing_overdue = base_qs.exclude(status__in=['COMPLETED', 'REJECTED']).filter(due_date__lt=now).count()

        return Response({
            'status_distribution': list(status_data),
            'department_volume': list(dept_data),
            'sla_health': {
                'met': met_sla,
                'missed': missed_sla,
                'ongoing_ontime': ongoing_ontime,
                'ongoing_overdue': ongoing_overdue
            }
        })
