package com.example.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.util.Date;


@Entity
@Builder
@Table(name = "invalid_token")
@NoArgsConstructor
@AllArgsConstructor
@Setter
@Getter
public class InvalidToken {
    @Id
    private String id;
    private Date expires;
}