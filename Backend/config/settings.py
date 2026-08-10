"""
Django settings — Sistemas de Indicadores GERESA CUSCO
"""

from pathlib import Path

from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config("SECRET_KEY", default="dev-only-change-me")
DEBUG = config("DEBUG", default=True, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "apps.accounts",
    "apps.patients",
    "apps.fed",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

_db_user = config("DB_USER", default="")
_db_password = config("DB_PASSWORD", default="")
_db_extra = "TrustServerCertificate=yes"
if not _db_user:
    _db_extra += ";Trusted_Connection=yes"

def _mssql_db(name: str) -> dict:
    db: dict = {
        "ENGINE": "mssql",
        "NAME": name,
        "HOST": config("DB_HOST", default=r"localhost\SQLEXPRESS"),
        "PORT": config("DB_PORT", default=""),
        "OPTIONS": {
            "driver": config("DB_DRIVER", default="ODBC Driver 17 for SQL Server"),
            "extra_params": _db_extra,
        },
    }
    if _db_user:
        db["USER"] = _db_user
        db["PASSWORD"] = _db_password
    return db


DATABASES = {
    "default": _mssql_db(config("DB_NAME", default="DBSISINDICADORE")),
    # Solo lectura analítica HIS / maestro pacientes
    "geresa": _mssql_db(config("DB_GERESA_NAME", default="DBGERESA")),
    # Solo lectura indicadores FED
    "fed": _mssql_db(config("DB_FED_NAME", default="DBFED2026")),
}

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "es-pe"
TIME_ZONE = "America/Lima"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

CORS_ALLOWED_ORIGINS = list(
    config(
        "CORS_ORIGINS",
        default="http://localhost:5173,http://127.0.0.1:5173",
        cast=Csv(),
    )
)
CORS_ALLOW_CREDENTIALS = True

ACCESS_TOKEN_EXPIRE_MINUTES = config("ACCESS_TOKEN_EXPIRE_MINUTES", default=60, cast=int)
