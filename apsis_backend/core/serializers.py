from rest_framework import serializers
from .models import CustomUser, Location, Department, Profile, Product, ApsisRequest, RequestItem

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = '__all__'

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'department', 'location', 'profile', 'allowed_profiles', 'allocated_products', 'gps_number', 'password']

    def save_password(self, instance, password):
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def create(self, validated_data):
        pw = validated_data.pop('password', None)
        return self.save_password(super().create(validated_data), pw)

    def update(self, instance, validated_data):
        pw = validated_data.pop('password', None)
        return self.save_password(super().update(instance, validated_data), pw)

class RequestItemSerializer(serializers.ModelSerializer):
    product_name = serializers.SerializerMethodField()
    class Meta:
        model = RequestItem
        fields = ['id', 'product', 'product_name', 'is_completed', 'action']
    def get_product_name(self, obj):
        return obj.product.name if obj.product else "Unknown Product"

class ApsisRequestSerializer(serializers.ModelSerializer):
    items = RequestItemSerializer(many=True, read_only=True)
    requester_name = serializers.SerializerMethodField()
    beneficiary_name = serializers.SerializerMethodField()
    technician_name = serializers.SerializerMethodField()
    is_overdue = serializers.ReadOnlyField()
    progress_percentage = serializers.ReadOnlyField()

    class Meta:
        model = ApsisRequest
        fields = [
            'id', 'request_type', 'status', 'requester', 'requester_name', 
            'beneficiary', 'beneficiary_name', 'technician', 'technician_name',
            'target_user_name', 'target_user_email', 'target_gps_number', 'profile', 'location', 'department',
            'created_at', 'due_date', 'completed_at', 'is_overdue', 'progress_percentage', 'items'
        ]
        extra_kwargs = {'requester': {'read_only': True}}

    def get_requester_name(self, obj):
        return obj.requester.get_full_name() or obj.requester.username

    def get_beneficiary_name(self, obj):
        if not obj.beneficiary: return obj.target_user_name
        return obj.beneficiary.get_full_name() or obj.beneficiary.username

    def get_technician_name(self, obj):
        if not obj.technician: return None
        return obj.technician.get_full_name() or obj.technician.username
