package org.lpu.dev.codes.repository;



import java.util.List;

import org.lpu.dev.codes.model.data.Users;
import org.springframework.stereotype.Repository;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Repository
public class UserRepository {

    @PersistenceContext
    private EntityManager entityManager;

    public void save(Users user) {
        entityManager.persist(user);
    }

    public Users findByUsername(String username) {

        String hql = """
                FROM Users u
                WHERE u.username = :username
                """;

        List<Users> users = entityManager
                .createQuery(hql, Users.class)
                .setParameter("username", username)
                .getResultList();

        return users.isEmpty() ? null : users.get(0);
    }
}
