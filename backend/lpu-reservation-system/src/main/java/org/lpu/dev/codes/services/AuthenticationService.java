package org.lpu.dev.codes.services;

import org.lpu.dev.codes.model.data.Users;
import org.lpu.dev.codes.model.dto.LoginRequest;
import org.lpu.dev.codes.model.dto.LoginResponse;
import org.lpu.dev.codes.repository.UserRepository;
import org.lpu.dev.codes.security.JWTUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

	@Autowired
	private UserRepository userRepository;
	@Autowired
	private JWTService jwtService;
	@Autowired
	private UserService userService;

	@Autowired
	private PasswordEncoder passwordEncoder;

	@Autowired
	private JWTUtil jwtUtil;

	public LoginResponse login(LoginRequest request) {
		LoginResponse response = new LoginResponse();

		Users user = userRepository.findByUsername(request.getUsername());

		if (user == null) {
			response.setSuccess(false);
			response.setMessage("Invalid username or password");
			return response;

		}

		if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {

			response.setSuccess(false);
			response.setMessage("Invalid username or password");
			return response;
		}

		String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

		response.setToken(token);
		response.setUsername(user.getUsername());
		response.setRole(user.getRole());

		response.setSuccess(true);
		response.setMessage("Login Successfull");

		response.setEmail(user.getEmail());
		response.setFullname(user.getFullname());
		response.setEmpId(user.getEmployeeId());

		return response;
	}

	public ResponseEntity<LoginResponse> validate(String authHeader) {
		String token = authHeader.replace("LpuL ", "");

		String username = jwtService.getUsername(token);

		if (username == null) {
			LoginResponse response = new LoginResponse();
			response.setSuccess(false);
			response.setMessage("Invalid token");
			return ResponseEntity.status(401).body(response);
		}

		Users user = userService.findByUserName(username);

		LoginResponse response = new LoginResponse();
		response.setToken(token);
		response.setSuccess(true);
		response.setMessage("User fetched successfully");

		response.setUsername(user.getUsername());
		response.setRole(user.getRole());
		response.setEmail(user.getEmail());
		response.setFullname(user.getFullname());
		response.setEmpId(user.getEmployeeId());

		return ResponseEntity.ok(response);
	}
}