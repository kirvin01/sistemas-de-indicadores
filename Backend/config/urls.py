from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView

from apps.accounts.api import api

urlpatterns = [
    path("", RedirectView.as_view(url="/api/docs", permanent=False)),
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
