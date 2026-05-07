from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Location, Department, Profile, Product, CustomUser, ApsisRequest, RequestItem

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'gps_number')
    fieldsets = UserAdmin.fieldsets + (('Apsis Info', {'fields': ('role', 'department', 'location', 'profile', 'allowed_profiles', 'allocated_products', 'gps_number')}),)

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name',)

class ItemInline(admin.TabularInline):
    model = RequestItem
    extra = 0

@admin.register(ApsisRequest)
class ApsisRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'request_type', 'status', 'requester', 'target_user_name', 'created_at')
    inlines = [ItemInline]

@admin.register(RequestItem)
class RequestItemAdmin(admin.ModelAdmin):
    list_display = ('request', 'product', 'action', 'is_completed')
