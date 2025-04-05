// Clasa pentru erori API
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

// Clasa pentru erori de validare
export class ValidationError extends ApiError {
  errors: any;
  
  constructor(message: string, errors: any) {
    super(message, 400);
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

// Clasa pentru erori de autorizare
export class AuthorizationError extends ApiError {
  constructor(message: string = 'Nu aveți permisiunea necesară pentru această acțiune') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

// Clasa pentru erori de autentificare
export class AuthenticationError extends ApiError {
  constructor(message: string = 'Autentificare necesară') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

// Clasa pentru erori de resurse negăsite
export class NotFoundError extends ApiError {
  constructor(message: string = 'Resursa nu a fost găsită') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}