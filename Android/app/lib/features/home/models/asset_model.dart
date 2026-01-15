
class AssetModel {
  final String id;
  final String title;
  final String subtitle;
  final double apy;
  final String icon; // Using emoji or icon name for MVP

  const AssetModel({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.apy,
    required this.icon,
  });
}
