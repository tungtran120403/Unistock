package vn.unistock.unistockmanagementsystem.exception;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class Error<T> {
    private int code;
    private String message;
    private T result;
}
