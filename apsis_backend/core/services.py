from django.utils.crypto import get_random_string
from core.models import CustomUser

def provision_beneficiary_from_request(req):
    un = req.target_user_email.split('@')[0] if req.target_user_email else req.target_user_name.lower().replace(' ', '.')
    
    while CustomUser.objects.filter(username=un).exists():
        un += get_random_string(3, '1234567890')
        
    beneficiary = CustomUser.objects.create(
        username=un, 
        email=req.target_user_email, 
        first_name=req.target_user_name.split(' ')[0], 
        last_name=' '.join(req.target_user_name.split(' ')[1:]), 
        department=req.department, 
        location=req.location, 
        profile=req.profile, 
        role='BENEFICIARY',
        gps_number=req.target_gps_number
    )
    beneficiary.set_unusable_password()
    beneficiary.save()
    return beneficiary

def apply_request_items_to_beneficiary(req, beneficiary):
    if req.request_type in ['ONBOARD', 'TRANSFER']:
        beneficiary.location = req.location
        beneficiary.department = req.department
        beneficiary.profile = req.profile

    for item in req.items.filter(is_completed=True):
        if item.action == 'ADD':
            beneficiary.allocated_products.add(item.product)
        elif item.action == 'REMOVE':
            beneficiary.allocated_products.remove(item.product)
            
    beneficiary.save()

def generate_request_items(req, beneficiary, profile, items_data):
    from core.models import RequestItem
    selected_ids = [i['product'] for i in items_data]

    if req.request_type == 'TRANSFER' and beneficiary and profile:
        cur, tar = set(beneficiary.allocated_products.all()), set(profile.products.all())
        for p in tar:
            if not selected_ids or p.id in selected_ids:
                action = 'MAINTAIN' if p in cur else 'ADD'
                RequestItem.objects.create(request=req, product=p, action=action)
        for p in cur - tar:
            RequestItem.objects.create(request=req, product=p, action='REMOVE')
            
    elif req.request_type == 'OFFBOARD' and beneficiary:
        for p in beneficiary.allocated_products.all():
            if not selected_ids or p.id in selected_ids:
                RequestItem.objects.create(request=req, product=p, action='REMOVE')
                
    elif items_data:
        for i in items_data:
            RequestItem.objects.create(request=req, product_id=i['product'], action=i.get('action', 'ADD'))
            
    elif req.request_type == 'ONBOARD' and profile:
        for p in profile.products.all():
            RequestItem.objects.create(request=req, product=p, action='ADD')
