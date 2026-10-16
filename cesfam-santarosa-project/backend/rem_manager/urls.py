# rem_manager/urls.py
from django.urls import path

from .views import RemArchivoListView, RemUploadView

urlpatterns = [
    path('upload/', RemUploadView.as_view(), name='rem-upload'),
    path('archivos/', RemArchivoListView.as_view(), name='rem-archivos'),
]
