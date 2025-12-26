class ApiResponse {
    static success(data = null, message = 'Success') {
        return {
            success: true,
            message,
            data
        };
    }

    static error(message = 'An error occurred', statusCode = 500) {
        return {
            success: false,
            message,
            error: {
                code: statusCode,
                message
            }
        };
    }

    static validationError(errors) {
        return {
            success: false,
            message: 'Validation failed',
            errors
        };
    }

    static notFound(message = 'Resource not found') {
        return {
            success: false,
            message
        };
    }

    static unauthorized(message = 'Unauthorized') {
        return {
            success: false,
            message
        };
    }

    static forbidden(message = 'Forbidden') {
        return {
            success: false,
            message
        };
    }
}

module.exports = ApiResponse;