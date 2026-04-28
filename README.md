Trabajo Practico Aplicaciones Web 2
Completo Backend + Frontend

Pruebas locales se hacen con:
npm run dev
luego el liveserver

Explicaciones de Endpoints:
DELETE /usuarios/:id
400 si el id es inválido.
404 si el usuario no existe.
409 si no se puede borrar porque tiene ventas asociadas.
200 si se elimina correctamente.
POST /productos
Rechaza categoria, nombre, desc e imagen vacíos o no string.
Rechaza precio si no es número válido o si es menor a 0.
Rechaza en_oferta si no es booleano.
POST /ventas
Rechaza id_usuario inválido.
Rechaza total no numérico o menor a 0.
Rechaza productos vacíos o mal formateados.
Rechaza productos que no existen, devolviendo también cuáles ids son inválidos.
POST /ventas/detail
400 si faltan from o to.
404 si no hay ventas en ese rango.
200 si hay resultados, devolviendo mensaje + filtro usado + ventas
