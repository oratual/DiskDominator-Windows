# Instrucciones para reiniciar el servidor DiskDominator

Después de reiniciar WSL2, ejecuta estos comandos:

```bash
cd ~/glados/DiskDominator
HOST=0.0.0.0 npm run dev
```

## URLs para acceder:
- http://127.0.0.1:3000
- http://localhost:3000
- http://[Tu-IP-WSL2]:3000

## Configuración aplicada:
- ✅ Variables de entorno en `.env.local`
- ✅ Archivo `.wslconfig` con modo de red mirrored
- ✅ Servidor configurado para escuchar en 0.0.0.0

## Si persiste el problema:
1. Verifica que el puerto 3000 no esté en uso en Windows
2. Desactiva el "Inicio rápido" de Windows
3. Verifica el firewall de Windows