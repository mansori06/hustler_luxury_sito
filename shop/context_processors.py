"""Context processor: rende disponibili i prodotti in JS su tutte le pagine.

Fornisce `products_json`, una stringa JSON con la stessa struttura di
data/products.json originale (id, nome, categoria, prezzo, prezzoBarrato,
immagini, taglie, descrizione, novita). In questo modo app.js può caricare
i prodotti dal DB invece di fare fetch su products.json, mantenendo
invariata la logica del carrello, preferiti e card.
"""
import json

from .models import Product


def products_data(request):
    items = []
    for p in Product.objects.all():
        immagini = p.immagini_list()
        items.append({
            'id': p.slug,
            'nome': p.name,
            'categoria': p.categoria,
            'prezzo': float(p.price),
            'prezzoBarrato': float(p.prezzo_barrato) if p.prezzo_barrato else None,
            'immagini': immagini,
            'taglie': p.taglie,
            'descrizione': p.description,
            'novita': p.novita,
        })
    return {'products_json': json.dumps(items)}
