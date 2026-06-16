package org.lpu.dev.codes.controller;

import org.lpu.dev.codes.model.apiresponse.AccountStatementResponse;
import org.lpu.dev.codes.model.apiresponse.PopulateUsersResponse;
import org.lpu.dev.codes.model.data.Users;
import org.lpu.dev.codes.model.dto.DeleteUserRequest;
import org.lpu.dev.codes.services.JWTService;
import org.lpu.dev.codes.services.SuperAdminUserService;
import org.lpu.dev.codes.services.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
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

	@PostMapping("/admin/createacc")
	public AccountStatementResponse createAccount(@RequestHeader("Authorization") String authHeader,
			@RequestBody Users user) {
		String token = authHeader.replace("LpuL ", "");
		if ("SUPERADMIN".equals(jwtService.getRole(token))) {
			user.setUsername(user.getUsername().toLowerCase());
			return userService.createAccount(authHeader, user);
		}
		return null;

	}
//asd
	@DeleteMapping("/admin/deleteacc")
	public AccountStatementResponse deleteAccount(
	        @RequestHeader("Authorization") String authHeader,
	        @RequestParam("empId") String empId) {

	    String token = authHeader.replace("LpuL ", "");

	    if ("SUPERADMIN".equals(jwtService.getRole(token))) {

	        DeleteUserRequest request = new DeleteUserRequest();
	        request.setEmpId(empId);

	        return userService.deleteAccountbyEmpId(authHeader, request);
	    }

	    AccountStatementResponse response = new AccountStatementResponse();
	    response.setSuccess(false);
	    response.setMessage("Unauthorized");

	    return response;
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
}
