import { htmlToText, formatDescription } from "../../../src/utils/html-to-text";

describe("htmlToText", () => {
  describe("basic functionality", () => {
    it("should return undefined for null input", () => {
      expect(htmlToText(null)).toBeUndefined();
    });

    it("should return undefined for undefined input", () => {
      expect(htmlToText(undefined)).toBeUndefined();
    });

    it("should return undefined for empty string", () => {
      expect(htmlToText("")).toBeUndefined();
    });

    it("should strip simple HTML tags", () => {
      expect(htmlToText("<p>Hello World</p>")).toBe("Hello World");
    });

    it("should handle nested tags", () => {
      expect(htmlToText("<div><p><strong>Bold</strong> text</p></div>")).toBe("Bold text");
    });
  });

  describe("block element handling", () => {
    it("should convert paragraph tags to double newlines", () => {
      expect(htmlToText("<p>First</p><p>Second</p>")).toBe("First\n\nSecond");
    });

    it("should convert div tags to newlines", () => {
      expect(htmlToText("<div>Line 1</div><div>Line 2</div>")).toBe("Line 1\nLine 2");
    });

    it("should convert br tags to newlines", () => {
      expect(htmlToText("Line 1<br>Line 2<br/>Line 3")).toBe("Line 1\nLine 2\nLine 3");
    });

    it("should convert headings to double newlines", () => {
      expect(htmlToText("<h1>Title</h1><p>Content</p>")).toBe("Title\n\nContent");
    });

    it("should convert horizontal rules", () => {
      expect(htmlToText("Above<hr>Below")).toBe("Above\n---\nBelow");
    });
  });

  describe("list handling", () => {
    it("should add bullet points for list items", () => {
      const result = htmlToText("<ul><li>Item 1</li><li>Item 2</li></ul>");
      expect(result).toContain("• Item 1");
      expect(result).toContain("• Item 2");
    });

    it("should handle ordered lists", () => {
      const result = htmlToText("<ol><li>First</li><li>Second</li></ol>");
      expect(result).toContain("• First");
      expect(result).toContain("• Second");
    });
  });

  describe("HTML entity decoding", () => {
    it("should decode &nbsp;", () => {
      expect(htmlToText("Hello&nbsp;World")).toBe("Hello World");
    });

    it("should decode &amp;", () => {
      expect(htmlToText("A &amp; B")).toBe("A & B");
    });

    it("should decode &lt; and &gt;", () => {
      expect(htmlToText("&lt;tag&gt;")).toBe("<tag>");
    });

    it("should decode &quot;", () => {
      expect(htmlToText('Say &quot;Hello&quot;')).toBe('Say "Hello"');
    });

    it("should decode &#39; and &apos;", () => {
      expect(htmlToText("It&#39;s")).toBe("It's");
      expect(htmlToText("It&apos;s")).toBe("It's");
    });

    it("should decode numeric entities", () => {
      expect(htmlToText("&#65;&#66;&#67;")).toBe("ABC");
    });

    it("should decode hex entities", () => {
      expect(htmlToText("&#x41;&#x42;&#x43;")).toBe("ABC");
    });

    it("should decode special characters", () => {
      expect(htmlToText("&ndash;&mdash;&hellip;")).toBe("–—…");
      expect(htmlToText("&copy;&reg;&trade;")).toBe("©®™");
    });
  });

  describe("whitespace handling", () => {
    it("should collapse multiple spaces", () => {
      expect(htmlToText("Hello    World")).toBe("Hello World");
    });

    it("should limit consecutive newlines", () => {
      expect(htmlToText("<p>A</p>\n\n\n\n<p>B</p>")).toBe("A\n\nB");
    });

    it("should trim leading and trailing whitespace", () => {
      expect(htmlToText("  <p>Hello</p>  ")).toBe("Hello");
    });
  });

  describe("complex HTML", () => {
    it("should handle Azure DevOps style descriptions", () => {
      const html = `<div><p><b>Summary</b></p><p>This is a test description with <strong>bold</strong> and <em>italic</em> text.</p><ul><li>Point 1</li><li>Point 2</li></ul></div>`;
      const result = htmlToText(html);
      expect(result).toContain("Summary");
      expect(result).toContain("bold");
      expect(result).toContain("italic");
      expect(result).toContain("• Point 1");
      expect(result).toContain("• Point 2");
    });

    it("should handle repro steps format", () => {
      const html = `<p>Steps to reproduce:</p><ol><li>Open the application</li><li>Click the button</li><li>Observe the error</li></ol>`;
      const result = htmlToText(html);
      expect(result).toContain("Steps to reproduce:");
      expect(result).toContain("• Open the application");
      expect(result).toContain("• Click the button");
      expect(result).toContain("• Observe the error");
    });
  });
});

describe("formatDescription", () => {
  it("should return undefined for null input", () => {
    expect(formatDescription(null)).toBeUndefined();
  });

  it("should return undefined for undefined input", () => {
    expect(formatDescription(undefined)).toBeUndefined();
  });

  it("should return undefined for empty string", () => {
    expect(formatDescription("")).toBeUndefined();
  });

  it("should process HTML content", () => {
    expect(formatDescription("<p>Hello</p>")).toBe("Hello");
  });

  it("should pass through plain text unchanged", () => {
    expect(formatDescription("Plain text without HTML")).toBe("Plain text without HTML");
  });

  it("should trim plain text", () => {
    expect(formatDescription("  Plain text  ")).toBe("Plain text");
  });

  it("should detect and convert HTML even with minimal tags", () => {
    expect(formatDescription("Test <b>bold</b> text")).toBe("Test bold text");
  });
});
