"""Comando per caricare i prodotti del sito statico nel database.

Legge i dati originali da _vecchi/data/products.json (identici a
data/products.json originale) e crea/aggiorna i record Product, copiando le
immagini da _vecchi/images/ in MEDIA_ROOT/products/.

Uso:
    python manage.py load_products
"""
import json
import os
import shutil

from django.core.management.base import BaseCommand
from django.conf import settings

from shop.models import Product

BASE = settings.BASE_DIR


class Command(BaseCommand):
    help = "Carica i prodotti da _vecchi/data/products.json nel database"

    def handle(self, *args, **options):
        src_json = BASE / "_vecchi" / "data" / "products.json"
        src_img_dir = BASE / "_vecchi" / "images"
        if not src_json.exists():
            self.stderr.write(self.style.ERROR(f"File non trovato: {src_json}"))
            return
        with open(src_json, encoding="utf-8") as f:
            items = json.load(f)

        media_products = settings.MEDIA_ROOT / "products"
        media_products.mkdir(parents=True, exist_ok=True)

        created = 0
        updated = 0
        for p in items:
            slug = p["id"]
            # Gestione immagini: la prima va in image, la seconda (se presente) in image2
            immagini = p.get("immagini", [])
            image_name = None
            image2_name = None
            for idx, src_path in enumerate(immagini):
                fname = os.path.basename(src_path)  # es. prodotto-01.jpg
                dest = media_products / fname
                # Copia l'immagine nella cartella media se non è già presente
                if not dest.exists() and (src_img_dir / fname).exists():
                    shutil.copy2(src_img_dir / fname, dest)
                field_val = "products/" + fname
                if idx == 0:
                    image_name = field_val
                elif idx == 1:
                    image2_name = field_val

            defaults = {
                "name": p["nome"],
                "price": p["prezzo"],
                "prezzo_barrato": p.get("prezzoBarrato") or None,
                "categoria": p.get("categoria", ""),
                "novita": p.get("novita", False),
                "description": p.get("descrizione", ""),
                "available": True,
                "taglie": p.get("taglie", []),
            }
            if image_name:
                defaults["image"] = image_name
            if image2_name:
                defaults["image2"] = image2_name

            obj, made = Product.objects.update_or_create(slug=slug, defaults=defaults)
            if made:
                created += 1
            else:
                updated += 1
            self.stdout.write(
                self.style.SUCCESS(f"  - {obj.name} (slug={slug}) "
                                   f"{'(creato)' if made else '(aggiornato)'}")
            )

        self.stdout.write(self.style.SUCCESS(
            f"\nCaricamento completato: {created} nuovi, {updated} aggiornati su {len(items)} prodotti."
        ))
