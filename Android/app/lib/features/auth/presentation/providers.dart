import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/auth_repository.dart';
import '../data/user_model.dart';

final authRepositoryProvider = Provider((ref) => AuthRepository());

final authStateProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
      return AuthNotifier(ref.read(authRepositoryProvider));
    });

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AsyncValue.data(null)) {
    _restoreSession();
  }

  Future<void> _restoreSession() async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.getUser();
      if (mounted) {
        state = AsyncValue.data(user);
      }
    } catch (e, st) {
      if (mounted) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  Future<void> login() async {
    state = const AsyncValue.loading();
    try {
      final user = await _repository.login();
      if (mounted) {
        state = AsyncValue.data(user);
      }
    } catch (e, st) {
      if (mounted) {
        state = AsyncValue.error(e, st);
      }
    }
  }

  Future<void> logout() async {
    state = const AsyncValue.loading();
    try {
      await _repository.logout();
      if (mounted) {
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      if (mounted) {
        state = AsyncValue.error(e, st);
      }
    }
  }
}
