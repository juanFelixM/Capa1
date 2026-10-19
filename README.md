# Sistema de Reservas - Gestion de Servicios (Capa 1)

- **Nombre completo:** Juan Felix Maria Baldera
- **Matricula:** 2013-0680
- **Correo:** Juan_maria1@ucne.edu.do
- **URL API Endpoint:** http://localhost:3000

## Endpoints

- `POST /auth/registro` — Publico (Crear cuenta)
- `POST /auth/login` — Publico (Iniciar sesion)
- `GET /servicios` — Autenticado (Listar servicios)
- `POST /servicios` — Solo admin (Crear servicio)
- `PUT /servicios/:id` — Solo admin (Editar servicio)
- `DELETE /servicios/:id` — Solo admin (Eliminar servicio)

## Capturas de Pantalla

### Pantallas Principales

| Inicio de Sesion | Inicio / Perfil | Servicios (Admin) |
| :---: | :---: | :---: |
| ![Inicio de Sesion](image/image.png) | ![Inicio](image/image1.png) | ![Servicios Admin](image/image2.png) |

### Flujos Adicionales

| Registro de Usuario | Editar Servicio | Confirmacion de Eliminacion | Vista de Cliente |
| :---: | :---: | :---: | :---: |
| ![Registro](image/image3.png) | ![Editar Servicio](image/image5.png) | ![Eliminar Servicio](image/image4.png) | ![Servicios Cliente](image/image6.png) |
