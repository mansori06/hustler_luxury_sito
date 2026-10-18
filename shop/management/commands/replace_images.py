"""Comando per sostituire TUTTE le immagini prodotto con la foto unica
fornita ("foto_per_riguadri"). Aggiorna i campi Product.image e
Product.image2 per tutti i prodotti e riallinea anche
shop/static/shop/data/products.json (fonte di fallback usata da app.js)
in modo che JS e database siano coerenti.

Uso:
    python manage.py replace_images
"""
import json
import os

from django.conf import settings
from django.core.management.base import BaseCommand

from shop.models import Product

# Nome relativo della foto unica dentro MEDIA_ROOT
FOTO_REL = "products/foto_per_riguadri.jpeg"
# Percorso della copia di riferimento in shop/static/shop/data/products.json
STATIC_JSON = settings.BASE_DIR / "shop" / "static" / "shop" / "data" / "products.json"


class Command(BaseCommand):
    help = "Sostituisce tutte le immagini prodotto con la foto unica fornita"

    def handle(self, *args, **options):
        totale = Product.objects.count()
        self.stdout.write(f"Prodotti da aggiornare: {totale}")

        # 1) Aggiorna i campi image e image2 nel database per tutti i prodotti
        aggiornati = 0
        for p in Product.objects.all():
            p.image.name = FOTO_REL
            p.image2.name = FOTO_REL
            p.save(update_fields=["image", "image2"])
            aggiornati += 1
        self.stdout.write(self.style.SUCCESS(f"  DB aggiornati: {aggiornati}/{totale} (image e image2 -> {FOTO_REL})"))

        # 2) Allinea products.json (fallback usato da app.js) con i nuovi path
        if STATIC_JSON.exists():
            with open(STATIC_JSON, encoding="utf-8") as f:
                items = json.load(f)
            for item in items:
                item["immagini"] = ["/" + FOTO_REL, "/" + FOTO_REL]
            with open(STATIC_JSON, "w", encoding="utf-8") as f:
                json.dump(items, f, ensure_ascii=False, indent=2)
            self.stdout.write(self.style.SUCCESS(f"  products.json aggiornato ({len(items)} voci)"))
        else:
            self.stdout.write(self.style.WARNING(f"  products.json non trovato in {STATIC_JSON}"))

        self.stdout.write(self.style.SUCCESS("Sostituzione immagini completata."))
