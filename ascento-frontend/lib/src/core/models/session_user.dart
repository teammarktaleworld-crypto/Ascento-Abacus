class SessionUser {
  const SessionUser({
    required this.accessToken,
    required this.refreshToken,
    required this.role,
    required this.userId,
    required this.fullName,
    this.email,
    this.phone,
    this.username,
    this.profileId,
  });

  final String accessToken;
  final String refreshToken;
  final String role;
  final String userId;
  final String fullName;
  final String? email;
  final String? phone;
  final String? username;
  final String? profileId;

  factory SessionUser.fromLoginResponse(Map<String, dynamic> map, String roleHint) {
    final user = map['user'] as Map<String, dynamic>? ?? <String, dynamic>{};
    return SessionUser(
      accessToken: (map['accessToken'] ?? '') as String,
      refreshToken: (map['refreshToken'] ?? '') as String,
      role: ((user['role'] ?? roleHint) as String).toLowerCase(),
      userId: (user['id'] ?? user['_id'] ?? '') as String,
      fullName: (user['fullName'] ?? '') as String,
      email: user['email'] as String?,
      phone: user['phone'] as String?,
      username: user['username'] as String?,
      profileId: user['profileId']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'accessToken': accessToken,
      'refreshToken': refreshToken,
      'role': role,
      'userId': userId,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'username': username,
      'profileId': profileId,
    };
  }

  factory SessionUser.fromJson(Map<String, dynamic> map) {
    return SessionUser(
      accessToken: (map['accessToken'] ?? '') as String,
      refreshToken: (map['refreshToken'] ?? '') as String,
      role: (map['role'] ?? '') as String,
      userId: (map['userId'] ?? '') as String,
      fullName: (map['fullName'] ?? '') as String,
      email: map['email'] as String?,
      phone: map['phone'] as String?,
      username: map['username'] as String?,
      profileId: map['profileId'] as String?,
    );
  }
}
