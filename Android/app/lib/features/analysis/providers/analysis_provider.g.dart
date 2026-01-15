// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'analysis_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint, type=warning

@ProviderFor(analysisData)
final analysisDataProvider = AnalysisDataProvider._();

final class AnalysisDataProvider
    extends
        $FunctionalProvider<
          AsyncValue<AnalysisData>,
          AnalysisData,
          FutureOr<AnalysisData>
        >
    with $FutureModifier<AnalysisData>, $FutureProvider<AnalysisData> {
  AnalysisDataProvider._()
    : super(
        from: null,
        argument: null,
        retry: null,
        name: r'analysisDataProvider',
        isAutoDispose: true,
        dependencies: null,
        $allTransitiveDependencies: null,
      );

  @override
  String debugGetCreateSourceHash() => _$analysisDataHash();

  @$internal
  @override
  $FutureProviderElement<AnalysisData> $createElement(
    $ProviderPointer pointer,
  ) => $FutureProviderElement(pointer);

  @override
  FutureOr<AnalysisData> create(Ref ref) {
    return analysisData(ref);
  }
}

String _$analysisDataHash() => r'cf3fba0b8e34d733c59425a73e3666d0b372e275';
