# Despliegue — Sistema de Indicadores

Dominio: **https://indicadores.diresacusco.gob.pe**

| Contenedor | Imagen |
|---|---|
| `indicadores-api` | `indicadores-api` (Django Ninja) |
| `indicadores-front` | `nginx:1.27-alpine` |

Base de aplicación: **`DB_SIS_INDICADOR`** en `172.16.20.5`.

## Primera vez

```bash
sudo mkdir -p /var/www/sistemas-de-indicadores
sudo chown geresa:geresa /var/www/sistemas-de-indicadores
git clone https://github.com/kirvin01/sistemas-de-indicadores.git /var/www/sistemas-de-indicadores

cd /var/www/sistemas-de-indicadores
cp deploy/.env.example deploy/.env
nano deploy/.env   # SQL, SECRET_KEY, CORS

# Frontend (mismo dominio)
cat > Frontend/.env << 'EOF'
VITE_API_URL=https://indicadores.diresacusco.gob.pe/api
EOF
cd Frontend && npm ci && npm run build && cd ..

# Bajar Convenios y subir este stack
cd /var/www/convenio/deploy && docker compose down
cd /var/www/sistemas-de-indicadores/deploy && docker compose up -d --build

docker compose exec api python manage.py migrate
docker compose exec api python manage.py seed_admin

sudo cp /etc/nginx/sites-available/indicadores /etc/nginx/sites-available/indicadores.bak
sudo cp nginx-host.conf.example /etc/nginx/sites-available/indicadores
sudo nginx -t && sudo systemctl reload nginx
```

## Actualizar

```bash
cd /var/www/sistemas-de-indicadores
git pull
cd Frontend && npm ci && npm run build && cd ..
cd deploy && docker compose up -d --build
```

## Rollback

```bash
cd /var/www/sistemas-de-indicadores/deploy && docker compose down
cd /var/www/convenio/deploy && docker compose up -d
sudo cp /etc/nginx/sites-available/indicadores.bak /etc/nginx/sites-available/indicadores
sudo nginx -t && sudo systemctl reload nginx
```
