from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MeView, ApsisRequestViewSet, ProfileViewSet, 
    ProductViewSet, UserViewSet, DepartmentViewSet, LocationViewSet, AnalyticsView
)

router = DefaultRouter()
router.register(r'requests', ApsisRequestViewSet, basename='request')
router.register(r'profiles', ProfileViewSet)
router.register(r'products', ProductViewSet)
router.register(r'users', UserViewSet, basename='user')
router.register(r'departments', DepartmentViewSet)
router.register(r'locations', LocationViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('me/', MeView.as_view(), name='me'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
]
