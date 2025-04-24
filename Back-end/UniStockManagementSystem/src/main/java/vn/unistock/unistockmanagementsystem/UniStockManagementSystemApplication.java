package vn.unistock.unistockmanagementsystem;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class UniStockManagementSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(UniStockManagementSystemApplication.class, args);
    }

}
