const db = require('../config/database');

// Obtener información de la doctora
exports.getInfo = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, d.especialidad, d.licencia_profesional, d.experiencia_anios, d.bio
             FROM usuarios u
             LEFT JOIN doctora d ON u.id = d.usuario_id
             WHERE u.rol = $1`,
            ['doctora']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Doctora no encontrada'
            });
        }

        res.json({
            success: true,
            doctora: result.rows[0]
        });
    } catch (error) {
        console.error('Error al obtener info de doctora:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener información',
            error: error.message
        });
    }
};

// Obtener todos los servicios
exports.getServicios = async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM servicios WHERE activo = true ORDER BY nombre'
        );

        res.json({
            success: true,
            servicios: result.rows
        });
    } catch (error) {
        console.error('Error al obtener servicios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener servicios',
            error: error.message
        });
    }
};

// Agregar servicio (solo doctora)
exports.crearServicio = async (req, res) => {
    try {
        const { nombre, descripcion, precio, duracion_minutos } = req.body;

        if (!nombre || !precio) {
            return res.status(400).json({
                success: false,
                message: 'Nombre y precio son requeridos'
            });
        }

        const result = await db.query(
            `INSERT INTO servicios (nombre, descripcion, precio, duracion_minutos, creado_por)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [nombre, descripcion, precio, duracion_minutos, req.user.id]
        );

        res.status(201).json({
            success: true,
            message: 'Servicio creado exitosamente',
            servicio: result.rows[0]
        });
    } catch (error) {
        console.error('Error al crear servicio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear servicio',
            error: error.message
        });
    }
};

// Actualizar servicio
exports.actualizarServicio = async (req, res) => {
    try {
        const { servicioId } = req.params;
        const { nombre, descripcion, precio, duracion_minutos, activo } = req.body;

        const result = await db.query(
            `UPDATE servicios SET
                nombre = COALESCE($1, nombre),
                descripcion = COALESCE($2, descripcion),
                precio = COALESCE($3, precio),
                duracion_minutos = COALESCE($4, duracion_minutos),
                activo = COALESCE($5, activo),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $6
             RETURNING *`,
            [nombre, descripcion, precio, duracion_minutos, activo, servicioId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Servicio no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Servicio actualizado exitosamente',
            servicio: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar servicio:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar servicio',
            error: error.message
        });
    }
};

// Obtener horarios
exports.getHorarios = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM horarios WHERE doctora_id = (SELECT id FROM usuarios WHERE rol = $1)
             ORDER BY 
                CASE dia_semana
                    WHEN 'lunes' THEN 1
                    WHEN 'martes' THEN 2
                    WHEN 'miercoles' THEN 3
                    WHEN 'jueves' THEN 4
                    WHEN 'viernes' THEN 5
                    WHEN 'sabado' THEN 6
                END`,
            ['doctora']
        );

        res.json({
            success: true,
            horarios: result.rows
        });
    } catch (error) {
        console.error('Error al obtener horarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener horarios',
            error: error.message
        });
    }
};

// Actualizar horarios
exports.actualizarHorario = async (req, res) => {
    try {
        const { horarioId } = req.params;
        const { hora_inicio, hora_fin, activo } = req.body;

        const result = await db.query(
            `UPDATE horarios SET
                hora_inicio = COALESCE($1, hora_inicio),
                hora_fin = COALESCE($2, hora_fin),
                activo = COALESCE($3, activo),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4
             RETURNING *`,
            [hora_inicio, hora_fin, activo, horarioId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Horario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Horario actualizado exitosamente',
            horario: result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar horario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar horario',
            error: error.message
        });
    }
};

// Obtener citas del día/mes
exports.getCitas = async (req, res) => {
    try {
        const { filtro } = req.query; // 'hoy', 'proximo_mes', 'todas'

        let query = `
            SELECT c.*, p.usuario_id as paciente_usuario_id, 
                   u.nombre as paciente_nombre, u.apellido as paciente_apellido, u.email as paciente_email,
                   s.nombre as servicio_nombre
            FROM citas c
            JOIN pacientes p ON c.paciente_id = p.id
            JOIN usuarios u ON p.usuario_id = u.id
            LEFT JOIN servicios s ON c.servicio_id = s.id
            WHERE c.doctora_id = (SELECT id FROM usuarios WHERE rol = $1)
        `;
        const params = ['doctora'];

        if (filtro === 'hoy') {
            query += ` AND DATE(c.fecha) = CURRENT_DATE`;
        } else if (filtro === 'proximo_mes') {
            query += ` AND c.fecha BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
        }

        query += ` ORDER BY c.fecha DESC, c.hora DESC`;

        const result = await db.query(query, params);

        res.json({
            success: true,
            citas: result.rows
        });
    } catch (error) {
        console.error('Error al obtener citas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener citas',
            error: error.message
        });
    }
};

// Obtener métricas
exports.getMetricas = async (req, res) => {
    try {
        // Total de pacientes atendidos este mes
        const pacientesAtendidos = await db.query(
            `SELECT COUNT(DISTINCT c.paciente_id) as total
             FROM citas c
             WHERE c.doctora_id = (SELECT id FROM usuarios WHERE rol = $1)
             AND c.estado = 'completada'
             AND EXTRACT(YEAR FROM c.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
             AND EXTRACT(MONTH FROM c.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)`,
            ['doctora']
        );

        // Servicios más solicitados
        const serviciosMassolicitados = await db.query(
            `SELECT s.nombre, COUNT(*) as total
             FROM citas c
             JOIN servicios s ON c.servicio_id = s.id
             WHERE c.doctora_id = (SELECT id FROM usuarios WHERE rol = $1)
             AND EXTRACT(YEAR FROM c.fecha) = EXTRACT(YEAR FROM CURRENT_DATE)
             AND EXTRACT(MONTH FROM c.fecha) = EXTRACT(MONTH FROM CURRENT_DATE)
             GROUP BY s.id, s.nombre
             ORDER BY total DESC
             LIMIT 5`,
            ['doctora']
        );

        // Ingresos mensuales
        const ingresosMensuales = await db.query(
            `SELECT COALESCE(SUM(f.monto_total), 0) as total_ingresos
             FROM facturacion f
             WHERE f.creado_por = (SELECT id FROM usuarios WHERE rol = $1)
             OR f.id IN (SELECT id FROM facturacion WHERE paciente_id IN (
                SELECT p.id FROM pacientes p
                JOIN citas c ON p.id = c.paciente_id
                WHERE c.doctora_id = (SELECT id FROM usuarios WHERE rol = $1)
             ))
             AND EXTRACT(YEAR FROM f.fecha_emision) = EXTRACT(YEAR FROM CURRENT_DATE)
             AND EXTRACT(MONTH FROM f.fecha_emision) = EXTRACT(MONTH FROM CURRENT_DATE)`,
            ['doctora']
        );

        res.json({
            success: true,
            metricas: {
                pacientesAtendidosEsMes: pacientesAtendidos.rows[0].total,
                serviciosMasSolicitados: serviciosMassolicitados.rows,
                ingresosMensuales: ingresosMensuales.rows[0].total_ingresos
            }
        });
    } catch (error) {
        console.error('Error al obtener métricas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener métricas',
            error: error.message
        });
    }
};
