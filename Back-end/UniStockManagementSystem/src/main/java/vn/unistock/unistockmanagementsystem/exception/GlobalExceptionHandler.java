package vn.unistock.unistockmanagementsystem.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler({MethodArgumentNotValidException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorResponse handleValidationException(Exception e, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setStatus((HttpStatus.BAD_REQUEST.value()));
        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponse.setError(HttpStatus.BAD_REQUEST.getReasonPhrase());

        if (e instanceof MethodArgumentNotValidException ex) {
            Map<String, String> fieldErrors = new HashMap<>();
            ex.getBindingResult().getFieldErrors().forEach(error ->
                    fieldErrors.put(error.getField(), error.getDefaultMessage())
            );

            errorResponse.setMessage("Validation failed");
            errorResponse.setFieldErrorMessages(fieldErrors); // ✅ map lỗi chi tiết
        } else {
            errorResponse.setMessage(e.getMessage());
        }

        return errorResponse;
    }

    @ExceptionHandler(value = RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleGeneralException(Exception e, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setStatus((HttpStatus.INTERNAL_SERVER_ERROR.value()));
        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponse.setError(HttpStatus.INTERNAL_SERVER_ERROR.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }

    @ExceptionHandler(value = AccessDeniedException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorResponse handleDefaultException(Exception e, WebRequest request) {
        ErrorResponse errorResponse = new ErrorResponse();
        errorResponse.setTimestamp(new Date());
        errorResponse.setStatus((HttpStatus.FORBIDDEN.value()));
        errorResponse.setPath(request.getDescription(false).replace("uri=", ""));
        errorResponse.setError(HttpStatus.FORBIDDEN.getReasonPhrase());
        errorResponse.setMessage(e.getMessage());
        return errorResponse;
    }
}
