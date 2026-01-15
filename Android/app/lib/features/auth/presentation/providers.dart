import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../data/user_model.dart';

final authRepositoryProvider = Provider((ref) => AuthRepository());

final authStateProvider = AsyncNotifierProvider<AuthNotifier, UserModel?>(
  AuthNotifier.new,
);

class AuthNotifier extends AsyncNotifier<UserModel?> {
  late final AuthRepository _repository;

  @override
  Future<UserModel?> build() async {
    _repository = ref.read(authRepositoryProvider);
    return _restoreSession();
  }

  Future<UserModel?> _restoreSession() async {
    try {
      final user = await _repository.getUser();
      return user;
    } catch (e) {
      // AsyncNotifier automatically handles error state, but we return null or throw?
      // restoreSession usually just checks if logged in.
      // If error, maybe return null?
      // But standard way is to throw.
      // Retaining original logic: catches and sets state.
      // In AsyncNotifier, throwing sets error state.
      rethrow;
    }
  }

  Future<void> login() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      return _repository.login();
    });
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await _repository.logout();
      return null;
    });
  }
}
