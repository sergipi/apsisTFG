from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import timedelta
from django.utils import timezone

class Location(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class Department(models.Model):
    name = models.CharField(max_length=100)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    def __str__(self):
        return self.name

class Profile(models.Model):
    name = models.CharField(max_length=255)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    products = models.ManyToManyField('Product', blank=True)
    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    def __str__(self):
        return self.name

class CustomUser(AbstractUser):
    ROLES = (('ADMIN', 'Admin'), ('IT_TECHNICIAN', 'Technician'), ('REQUESTER', 'Requester'), ('VIEWER', 'Viewer'), ('BENEFICIARY', 'Beneficiary'))
    role = models.CharField(max_length=20, choices=ROLES, default='REQUESTER')
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    allowed_profiles = models.JSONField(default=list, blank=True)
    allocated_products = models.ManyToManyField(Product, blank=True)
    gps_number = models.CharField(max_length=50, unique=True, null=True, blank=True)

class ApsisRequest(models.Model):
    TYPES = (('ONBOARD', 'Employee Onboard'), ('OFFBOARD', 'Employee Offboard'), ('TRANSFER', 'Department Transfer'), ('NEW_HW_SW', 'New Hardware / Software'))
    STATUS = (('PENDING_AUTH', 'Pending Authorization'), ('ASSIGNED', 'Assigned'), ('IN_PROGRESS', 'In Progress'), ('COMPLETED', 'Completed'), ('REJECTED', 'Rejected'))
    
    request_type = models.CharField(max_length=20, choices=TYPES)
    status = models.CharField(max_length=20, choices=STATUS, default='PENDING_AUTH')
    requester = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='requests_made')
    beneficiary = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests_for')
    technician = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks_assigned')
    target_user_name = models.CharField(max_length=200, blank=True, null=True)
    target_user_email = models.CharField(max_length=200, blank=True, null=True)
    target_gps_number = models.CharField(max_length=50, blank=True, null=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)


    def save(self, *args, **kwargs):
        if not self.id and not self.due_date:
            days = 4 if self.request_type == 'NEW_HW_SW' else 14
            self.due_date = timezone.now() + timedelta(days=days)
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        if self.status == 'COMPLETED' or not self.due_date:
            return False
        return timezone.now() > self.due_date


    @property
    def progress_percentage(self):
        items = self.items.all()
        total_items = items.count()
        if total_items == 0:
            return 100 if self.status == 'COMPLETED' else 0
        completed_items = items.filter(is_completed=True).count()
        return int((completed_items / total_items) * 100)

class RequestItem(models.Model):
    request = models.ForeignKey(ApsisRequest, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    action = models.CharField(max_length=10, choices=(('ADD', 'Add'), ('REMOVE', 'Remove'), ('MAINTAIN', 'Maintain')))
    is_completed = models.BooleanField(default=False)
