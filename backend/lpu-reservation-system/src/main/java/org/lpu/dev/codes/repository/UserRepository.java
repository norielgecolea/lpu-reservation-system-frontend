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
        entityManager.flush();
       
    }
    public boolean existsByRole(String role) {

        String hql = """
            SELECT COUNT(u)
            FROM Users u
            WHERE u.role = :role
            """;

        Long count = entityManager
                .createQuery(hql, Long.class)
                .setParameter("role", role)
                .getSingleResult();

        return count > 0;
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
    
    public List<Users> getAllUsers() {

        String hql = """
                FROM Users u
                ORDER BY u.fullname
                """;

        return entityManager
                .createQuery(hql, Users.class)
                .getResultList();
    }

    public List<Users> getUsersByRole(String role) {

        String hql = """
                FROM Users u
                WHERE u.role = :role
                ORDER BY u.fullname
                """;

        return entityManager
                .createQuery(hql, Users.class)
                .setParameter("role", role)
                .getResultList();
    }
    
    public boolean deleteUserByEmpId(String empId) {
        String hql = """
            DELETE FROM Users u
            WHERE u.employeeId = :empId
            """;

        int rowsAffected = entityManager.createQuery(hql)
                .setParameter("empId", empId)
                .executeUpdate();

        return rowsAffected > 0;
    }
    
    public Users findByEmployeeId(String employeeId) {

        String hql = """
                FROM Users u
                WHERE u.employeeId = :employeeId
                """;

        List<Users> users = entityManager
                .createQuery(hql, Users.class)
                .setParameter("employeeId", employeeId)
                .getResultList();

        return users.isEmpty() ? null : users.get(0);
    }
    
    public boolean updateStatus(String employeeId, String status) {

        String hql = """
                UPDATE Users u
                SET u.status = :status
                WHERE u.employeeId = :employeeId
                """;

        int rowsAffected = entityManager.createQuery(hql)
                .setParameter("status", status)
                .setParameter("employeeId", employeeId)
                .executeUpdate();

        return rowsAffected > 0;
    }
}
