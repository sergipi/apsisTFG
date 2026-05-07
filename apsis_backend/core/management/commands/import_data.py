import os
import csv
import logging
from django.core.management.base import BaseCommand
from core.models import CustomUser, Location, Department, Profile, Product

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **options):
        hq, _ = Location.objects.get_or_create(name='HQ')
        reg, _ = Location.objects.get_or_create(name='REGIONAL')

        def get_ld(name):
            p = name.split('-')
            l = hq if name.startswith('NAC') else reg
            dn = p[1] if len(p) > 1 else 'General'
            d, _ = Department.objects.get_or_create(name=dn, location=l)
            return l, d

        def get_enc(path):
            for e in ['utf-8-sig', 'latin-1']:
                try:
                    with open(path, 'r', encoding=e) as f:
                        f.read()
                    return e
                except Exception as ex:
                    logger.warning(f"Encoding {e} failed for {path}: {ex}")
                    continue
            return 'latin-1'

        enc_req = get_enc('data/requesters.csv')
        with open('data/requesters.csv', 'r', encoding=enc_req) as f:
            for r in csv.reader(f):
                if not r: continue
                fn = r[0].strip('"')
                un = fn.lower().replace(',', '').replace('\n', '').replace('\r', '').replace(' ', '.')
                while '..' in un:
                    un = un.replace('..', '.')
                un = un.strip('.')
                
                default_loc = hq
                default_dept, _ = Department.objects.get_or_create(name='General', location=default_loc)
                
                u, c = CustomUser.objects.get_or_create(
                    username=un, 
                    defaults={
                        'first_name': fn.split(',')[1].strip() if ',' in fn else fn,
                        'last_name': fn.split(',')[0].strip() if ',' in fn else '',
                        'email': f"{un}@apsis.com",
                        'role': 'REQUESTER',
                        'department': default_dept,
                        'location': default_loc
                    }
                )
                if c:
                    u.set_password('password123')
                    u.save()

        enc_prod = get_enc('data/product-perfil.csv')
        with open('data/product-perfil.csv', 'r', encoding=enc_prod) as f:
            reader = csv.reader(f, delimiter=';')
            next(reader, None)
            for r in reader:
                if len(r) < 3: continue
                pn, prn = r[0].strip(), r[2].strip()
                _, d = get_ld(pn)
                prof, _ = Profile.objects.get_or_create(name=pn)
                prof.department = d
                prof.save()
                prod = Product.objects.filter(name=prn).first()
                if not prod:
                    prod = Product.objects.create(name=prn)
                prof.products.add(prod)

        enc_pr = get_enc('data/perfil-requester.csv')
        with open('data/perfil-requester.csv', 'r', encoding=enc_pr) as f:
            for r in csv.reader(f):
                if len(r) < 2: continue
                pn, rn = r[0].strip(), r[1].strip('"').strip()
                un = rn.lower().replace(',', '').replace('\n', '').replace('\r', '').replace(' ', '.')
                while '..' in un:
                    un = un.replace('..', '.')
                un = un.strip('.')
                try:
                    u = CustomUser.objects.filter(username=un).first()
                    p = Profile.objects.filter(name=pn).first()
                    if u and p:
                        if not u.profile:
                            u.profile = p
                        if p.id not in u.allowed_profiles:
                            u.allowed_profiles.append(p.id)
                        if p.department:
                            u.department = p.department
                            if p.department.location:
                                u.location = p.department.location
                        u.save()
                except Exception as e:
                    logger.error(f"Error linking the profile {pn} to the user {un}: {e}")
                    continue
        
        self.stdout.write(self.style.SUCCESS('Import complete!'))
