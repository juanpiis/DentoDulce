const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token inválido o expirado'
        });
    }
};

const doctorMiddleware = (req, res, next) => {
    if (req.user?.rol !== 'doctora') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo doctores pueden acceder.'
        });
    }
    next();
};

const pacienteMiddleware = (req, res, next) => {
    if (req.user?.rol !== 'paciente') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo pacientes pueden acceder.'
        });
    }
    next();
};

module.exports = {
    authMiddleware,
    doctorMiddleware,
    pacienteMiddleware
};
