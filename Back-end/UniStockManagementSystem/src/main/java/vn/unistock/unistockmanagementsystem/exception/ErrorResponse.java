package vn.unistock.unistockmanagementsystem.exception;

import lombok.Getter;
import lombok.Setter;

import java.util.Date;
import java.util.Map;

@Getter
@Setter
public class ErrorResponse {
    private Date timestamp;
    private int status;
    private String path;
    private String error;
    private String message;
    private Map<String, String> fieldErrorMessages;
}
