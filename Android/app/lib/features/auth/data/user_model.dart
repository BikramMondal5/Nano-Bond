class UserModel {
  final String address;
  final String? name;
  final String? email;
  final String? profileImage;
  final String? privateKey; // Added for signing transactions

  UserModel({
    required this.address,
    this.name,
    this.email,
    this.profileImage,
    this.privateKey,
  });

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'name': name,
      'email': email,
      'profileImage': profileImage,
      'privateKey': privateKey,
    };
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      address: json['address'] ?? '',
      name: json['name'],
      email: json['email'],
      profileImage: json['profileImage'],
      privateKey: json['privateKey'],
    );
  }
}
