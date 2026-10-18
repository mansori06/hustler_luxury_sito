"""Modelli dell'app shop.

Product riproduce i dati di data/products.json originale.
Campi aggiuntivi rispetto alle specifiche minime (categoria, novita,
prezzo_barrato, image2, taglie) sono necessari a mantenere COMPRESSA la
grafica delle card e del dettaglio prodotto (badge 'Nuovo', sconto,
immagine hover, taglie disponibili).
"""
import json

from django.db import models


class Product(models.Model):
    # Identificativo/slug = id originale (es. prod-01)
    name = models.CharField('nome', max_length=200)
    slug = models.SlugField(unique=True, max_length=50,
                            help_text='Es. prod-01 — usato nelle URL e nel carrello')

    price = models.DecimalField('prezzo', max_digits=8, decimal_places=2)
    # Prezzo barrato (orig. prezzoBarrato); se presente, mostra lo sconto
    prezzo_barrato = models.DecimalField('prezzo barrato', max_digits=8,
                                          decimal_places=2, null=True, blank=True)

    categoria = models.CharField(max_length=100, default='')
    novita = models.BooleanField('nuovo', default=False)

    # Immagini: la prima è quella principale, la seconda (opzionale) serve
    # all'hover della card (prodotto-10b / prodotto-20b).
    image = models.ImageField('immagine principale', upload_to='products/')
    image2 = models.ImageField('immagine secondaria', upload_to='products/',
                               blank=True, null=True)

    # Taglie disponibili (es. ["S","M","L","XL"])
    taglie = models.JSONField(default=list)

    description = models.TextField('descrizione', blank=True)
    available = models.BooleanField('disponibile', default=True)
    created_at = models.DateTimeField('creato il', auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Prodotto'
        verbose_name_plural = 'Prodotti'

    def __str__(self):
        return self.name

    @property
    def discount(self):
        """Percentuale di sconto da prezzo barrato a prezzo listino."""
        if self.prezzo_barrato and self.prezzo_barrato > self.price:
            return round((1 - self.price / self.prezzo_barrato) * 100)
        return 0

    def immagini_list(self):
        """Restituisce la lista degli URL delle immagini (come products.json)."""
        urls = []
        if self.image:
            urls.append(self.image.url)
        if self.image2:
            urls.append(self.image2.url)
        return urls

    def prezzo_formattato(self):
        return str(self.price).replace('.', ',')

    def prezzo_barrato_formattato(self):
        return str(self.prezzo_barrato).replace('.', ',')
