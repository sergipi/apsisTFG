from celery import shared_task
from django.core.mail import send_mail
from django.utils import timezone
import logging
from .models import ApsisRequest, CustomUser

logger = logging.getLogger(__name__)

@shared_task
def send_apsis_notification(request_id, event_type, body=None):
    try:
        r = ApsisRequest.objects.get(id=request_id)
        subjects = {
            'CREATED': f"New Apsis Request: {r.request_type}",
            'APPROVED': f"Apsis Approved: {r.request_type}",
            'COMPLETED': f"Apsis Completed: {r.request_type}",
            'ASSIGNED': f"New Apsis Assigned: {r.request_type}"
        }
        recipients = {
            'CREATED': list(CustomUser.objects.filter(role='ADMIN').values_list('email', flat=True)),
            'APPROVED': [r.requester.email],
            'COMPLETED': [r.requester.email],
            'ASSIGNED': [r.technician.email] if r.technician else []
        }
        if event_type in subjects and recipients.get(event_type):
            msg = body or f"Notification for request {r.id}: {event_type}\nTarget: {r.target_user_name}"
            send_mail(subjects[event_type], msg, 'noreply@apsis.com', recipients[event_type])
    except Exception as e:
        logger.error(f"Failed to send notification for request {request_id}: {e}")

@shared_task
def check_overdue_requests():
    overdue = ApsisRequest.objects.filter(status__in=['PENDING_AUTH', 'ASSIGNED', 'IN_PROGRESS'], due_date__lt=timezone.now())
    if overdue.exists():
        admins = list(CustomUser.objects.filter(role='ADMIN').values_list('email', flat=True))
        if admins:
            send_mail("URGENT: Overdue Apsis", f"{overdue.count()} requests overdue.", 'noreply@apsis.com', admins)
