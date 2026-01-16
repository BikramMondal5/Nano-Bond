class IdParser {
  // Regex for 12-digit Aadhaar (xxxx xxxx xxxx)
  // Ensure not part of a larger number (like 16-digit card)
  static final RegExp _aadhaarRegex = RegExp(
    r'(?<!\d)[0-9]{4}\s[0-9]{4}\s[0-9]{4}(?!\d)',
  );

  // Regex for PAN (5 Letters, 4 Numbers, 1 Letter)
  static final RegExp _panRegex = RegExp(r'[A-Z]{5}[0-9]{4}[A-Z]{1}');

  // Regex for Date (DD/MM/YYYY or DD-MM-YYYY)
  static final RegExp _dateRegex = RegExp(r'\d{2}[/\-]\d{2}[/\-]\d{4}');

  // Keywords that indicate DOB (Date of Birth)
  static final List<String> _dobKeywords = [
    'DOB',
    'DATE OF BIRTH',
    'BIRTH',
    'YEAR OF BIRTH',
    'YOB',
    'जन्म तिथि', // Hindi for Date of Birth
  ];

  // Keywords that indicate Issue Date (to avoid)
  static final List<String> _issueDateKeywords = [
    'ISSUE',
    'ISSUED',
    'ISSUE DATE',
    'VID',
    'DOWNLOAD',
  ];

  static Map<String, String> parseText(String scannedText) {
    Map<String, String> result = {"type": "UNKNOWN", "number": "", "dob": ""};

    final upperText = scannedText.toUpperCase();

    // 1. Detect Document Type & Number with Strict Keyword Validation

    // Aadhaar Check
    if (_aadhaarRegex.hasMatch(scannedText)) {
      bool hasKeywords =
          upperText.contains("GOVERNMENT OF INDIA") ||
          upperText.contains("UNIQUE IDENTIFICATION") ||
          upperText.contains("AADHAAR");

      if (hasKeywords) {
        result["type"] = "AADHAAR";
        result["number"] = _aadhaarRegex.firstMatch(scannedText)!.group(0)!;
      }
    }

    // PAN Check (only if not recognized as Aadhaar)
    if (result["type"] == "UNKNOWN" && _panRegex.hasMatch(scannedText)) {
      bool hasKeywords =
          upperText.contains("INCOME TAX") ||
          upperText.contains("GOVT. OF INDIA") ||
          upperText.contains("PERMANENT ACCOUNT NUMBER");

      if (hasKeywords) {
        result["type"] = "PAN";
        result["number"] = _panRegex.firstMatch(scannedText)!.group(0)!;
      }
    }

    // 2. Extract DOB with smart detection (avoid Issue Date)
    result["dob"] = _extractDob(scannedText, upperText);

    return result;
  }

  /// Extracts Date of Birth, distinguishing it from Issue Date
  static String _extractDob(String scannedText, String upperText) {
    // Find all dates in the text
    final allDates = _dateRegex.allMatches(scannedText).toList();
    if (allDates.isEmpty) return "";

    // Strategy 1: Find date near DOB keywords
    for (final keyword in _dobKeywords) {
      final keywordIndex = upperText.indexOf(keyword);
      if (keywordIndex != -1) {
        // Look for the nearest date after the DOB keyword
        for (final match in allDates) {
          // Date should be within 50 characters after the keyword
          if (match.start >= keywordIndex && match.start - keywordIndex < 50) {
            return match.group(0)!;
          }
        }
      }
    }

    // Strategy 2: Filter out dates near Issue Date keywords
    List<RegExpMatch> candidateDates = [];
    for (final match in allDates) {
      bool isNearIssueKeyword = false;

      for (final keyword in _issueDateKeywords) {
        final keywordIndex = upperText.indexOf(keyword);
        if (keywordIndex != -1) {
          // If date is within 50 chars of issue keyword, skip it
          if ((match.start - keywordIndex).abs() < 50) {
            isNearIssueKeyword = true;
            break;
          }
        }
      }

      if (!isNearIssueKeyword) {
        candidateDates.add(match);
      }
    }

    // Strategy 3: From remaining dates, pick the one that looks like a birth year
    // (older than recent issue dates, typically year < current year - 5)
    final currentYear = DateTime.now().year;

    for (final match in candidateDates) {
      final dateStr = match.group(0)!;
      try {
        // Parse year from DD/MM/YYYY or DD-MM-YYYY
        final parts = dateStr.split(RegExp(r'[/\-]'));
        if (parts.length == 3) {
          final year = int.parse(parts[2]);
          // Birth year is typically older (person should be at least 5 years old)
          if (year <= currentYear - 5) {
            return dateStr;
          }
        }
      } catch (_) {
        // Parsing failed, continue to next
      }
    }

    // Strategy 4: If we have candidates but none passed year check, use first candidate
    if (candidateDates.isNotEmpty) {
      return candidateDates.first.group(0)!;
    }

    // Fallback: Return first date found (original behavior)
    return allDates.first.group(0)!;
  }
}
