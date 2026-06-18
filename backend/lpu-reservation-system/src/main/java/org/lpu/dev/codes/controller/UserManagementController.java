package org.lpu.dev.codes.controller;

import org.lpu.dev.codes.model.apiresponse.AccountStatementResponse;
import org.lpu.dev.codes.model.apiresponse.PopulateUsersResponse;
import org.lpu.dev.codes.model.data.Users;
import org.lpu.dev.codes.model.dto.DeleteUserRequest;
import org.lpu.dev.codes.model.dto.UpdateUserRequest;
import org.lpu.dev.codes.services.JWTService;
import org.lpu.dev.codes.services.SuperAdminUserService;
import org.lpu.dev.codes.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/")
@CrossOrigin("*")
public class UserManagementController {
	
	@Autowired
	private SuperAdminUserService userService;

	@Autowired
	private UserService userServ;

	@Autowired
	private JWTService jwtService;

	@GetMapping("/admin/users")
	public PopulateUsersResponse populateUserTable(@RequestHeader("Authorization") String authHeader) {
		String token = authHeader.replace("LpuL ", "");

		if ("SUPERADMIN".equals(jwtService.getRole(token))) {
			return userService.getAllUsers(token);
		} else {
			return null;
		}

	}

	@PostMapping("/admin/createuser")
	public AccountStatementResponse createAccount(@RequestHeader("Authorization") String authHeader,
			@RequestBody Users user) {
		String token = authHeader.replace("LpuL ", "");
		if ("SUPERADMIN".equals(jwtService.getRole(token))) {
			user.setUsername(user.getUsername().toLowerCase());
			return userService.createAccount(authHeader, user);
		}
		return null;

	}
	@DeleteMapping("/admin/deleteacc")
	public AccountStatementResponse deleteAccount(
	        @RequestHeader("Authorization") String authHeader,
	        @RequestParam("empId") String empId) {

	    String token = authHeader.replace("LpuL ", "");

	    if (!"SUPERADMIN".equals(jwtService.getRole(token))) {
	        AccountStatementResponse response = new AccountStatementResponse();
	        response.setSuccess(false);
	        response.setMessage("Unauthorized");
	        return response;
	    }

	    // Employee ID of currently logged-in user
	    String username = jwtService.getUsername(token);
	    Users user = userService.findByUserName(username);

	    if (empId.equalsIgnoreCase(user.getEmployeeId())) {
	        AccountStatementResponse response = new AccountStatementResponse();
	        response.setSuccess(false);
	        response.setMessage("You cannot delete your own account");
	        return response;
	    }

	    DeleteUserRequest request = new DeleteUserRequest();
	    request.setEmpId(empId);

	    return userService.deleteAccountbyEmpId(authHeader, request);
	}
	
	@PatchMapping("/admin/toggleaccstat")
	public AccountStatementResponse toggleAccountStatus(
	        @RequestHeader("Authorization") String authHeader,
	        @RequestParam("empId") String empId) {

	    String token = authHeader.replace("LpuL ", "");

	    if (!"SUPERADMIN".equals(jwtService.getRole(token))) {
	        AccountStatementResponse response = new AccountStatementResponse();
	        response.setSuccess(false);
	        response.setMessage("Unauthorized");
	        return response;
	    }

	    // Employee ID of currently logged-in user
	    String username = jwtService.getUsername(token);
	    Users user = userService.findByUserName(username);

	    if (empId.equalsIgnoreCase(user.getEmployeeId())) {
	        AccountStatementResponse response = new AccountStatementResponse();
	        response.setSuccess(false);
	        response.setMessage("You cannot change the status of your own account");
	        return response;
	    }

	    return userService.toggleAccountStatus(empId);
	}

	@GetMapping("/populateusers")
	public PopulateUsersResponse populateUser(@RequestHeader("Authorization") String authHeader) {
		String token = authHeader.replace("LpuL ", "");
		if (jwtService.validateToken(token)) {
			return userServ.getUsersByRole(token);

		} else {
			return null;
		}
	}
	//update user
	@PutMapping("/admin/updateuser")
	public AccountStatementResponse updateUser(
	        @RequestHeader("Authorization") String authHeader,
	        @RequestBody UpdateUserRequest request) {

	    String token = authHeader.replace("LpuL ", "");

	    if ("SUPERADMIN".equals(jwtService.getRole(token))) {
	        return userService.updateUser(request);
	    }

	    AccountStatementResponse response = new AccountStatementResponse();
	    response.setSuccess(false);
	    response.setMessage("Unauthorized access");

	    return response;
	}
}
