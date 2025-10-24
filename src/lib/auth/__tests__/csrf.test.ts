import type { NextRequest } from "next/server";

import { requiresCSRF, validateCSRF } from "../csrf";

// Mock console.warn to avoid noise in tests
const mockWarn = jest.spyOn(console, "warn").mockImplementation();

describe("CSRF Validation", () => {
  beforeEach(() => {
    mockWarn.mockClear();
  });

  afterAll(() => {
    mockWarn.mockRestore();
  });

  describe("validateCSRF", () => {
    const createMockRequest = (
      method: string,
      csrfCookie?: string,
      csrfHeader?: string,
      pathname = "/api/test"
    ): NextRequest => {
      const url = `http://localhost:3000${pathname}`;
      const request = {
        method,
        nextUrl: {
          pathname,
          href: url,
        },
        cookies: {
          get: jest.fn((name: string) => {
            if (name === "csrf" && csrfCookie) {
              return { value: csrfCookie, name: "csrf" };
            }
            return undefined;
          }),
        },
        headers: {
          get: jest.fn((name: string) => {
            if ((name === "X-CSRF-Token" || name === "x-csrf-token") && csrfHeader) {
              return csrfHeader;
            }
            return null;
          }),
        },
      } as unknown as NextRequest;

      return request;
    };

    describe("Safe methods (GET, HEAD, OPTIONS)", () => {
      it("should return true for GET requests without CSRF token", () => {
        const request = createMockRequest("GET");
        expect(validateCSRF(request)).toBe(true);
      });

      it("should return true for HEAD requests without CSRF token", () => {
        const request = createMockRequest("HEAD");
        expect(validateCSRF(request)).toBe(true);
      });

      it("should return true for OPTIONS requests without CSRF token", () => {
        const request = createMockRequest("OPTIONS");
        expect(validateCSRF(request)).toBe(true);
      });

      it("should return true for GET even with mismatched tokens", () => {
        const request = createMockRequest("GET", "token123", "different_token");
        expect(validateCSRF(request)).toBe(true);
      });
    });

    describe("State-changing methods (POST, PUT, PATCH, DELETE)", () => {
      it("should return true for POST with matching CSRF tokens", () => {
        const token = "valid_csrf_token_12345";
        const request = createMockRequest("POST", token, token);
        expect(validateCSRF(request)).toBe(true);
        expect(mockWarn).not.toHaveBeenCalled();
      });

      it("should return true for PUT with matching CSRF tokens", () => {
        const token = "valid_csrf_token_67890";
        const request = createMockRequest("PUT", token, token);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should return true for PATCH with matching CSRF tokens", () => {
        const token = "patch_token_abc";
        const request = createMockRequest("PATCH", token, token);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should return true for DELETE with matching CSRF tokens", () => {
        const token = "delete_token_xyz";
        const request = createMockRequest("DELETE", token, token);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should return false for POST without CSRF cookie", () => {
        const request = createMockRequest("POST", undefined, "header_token");
        expect(validateCSRF(request)).toBe(false);
        expect(mockWarn).toHaveBeenCalledWith(
          expect.stringContaining("[CSRF] Validation failed: POST /api/test"),
          expect.objectContaining({ hasCookie: false, hasHeader: true })
        );
      });

      it("should return false for POST without CSRF header", () => {
        const request = createMockRequest("POST", "cookie_token");
        expect(validateCSRF(request)).toBe(false);
        expect(mockWarn).toHaveBeenCalledWith(
          expect.stringContaining("[CSRF] Validation failed: POST /api/test"),
          expect.objectContaining({ hasCookie: true, hasHeader: false })
        );
      });

      it("should return false for POST with mismatched tokens", () => {
        const request = createMockRequest("POST", "cookie_token", "different_header_token");
        expect(validateCSRF(request)).toBe(false);
        expect(mockWarn).toHaveBeenCalledWith(
          expect.stringContaining("[CSRF] Token mismatch: POST /api/test"),
          expect.objectContaining({
            cookieLength: "cookie_token".length,
            headerLength: "different_header_token".length,
          })
        );
      });

      it("should return false for DELETE with mismatched tokens", () => {
        const request = createMockRequest("DELETE", "token_a", "token_b");
        expect(validateCSRF(request)).toBe(false);
      });

      it("should handle case-insensitive method names", () => {
        const token = "test_token";
        const request = createMockRequest("post", token, token);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should accept X-CSRF-Token header (capitalized)", () => {
        const token = "test_token";
        const request = createMockRequest("POST", token, token);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should accept x-csrf-token header (lowercase)", () => {
        const token = "test_token";
        const request = {
          method: "POST",
          nextUrl: { pathname: "/api/test" },
          cookies: {
            get: jest.fn(() => ({ value: token, name: "csrf" })),
          },
          headers: {
            get: jest.fn((name: string) => {
              if (name === "x-csrf-token") return token;
              return null;
            }),
          },
        } as unknown as NextRequest;

        expect(validateCSRF(request)).toBe(true);
      });

      it("should return false when both cookie and header are missing", () => {
        const request = createMockRequest("POST");
        expect(validateCSRF(request)).toBe(false);
      });

      it("should handle empty string tokens as invalid", () => {
        const request = createMockRequest("POST", "", "");
        expect(validateCSRF(request)).toBe(false);
      });

      it("should handle whitespace-only tokens correctly", () => {
        const request = createMockRequest("POST", "   ", "   ");
        // Whitespace tokens match each other (both are "   "), so validation passes
        // This is expected behavior - the tokens match
        expect(validateCSRF(request)).toBe(true);
      });
    });

    describe("Edge cases", () => {
      it("should handle very long matching tokens", () => {
        const longToken = "a".repeat(1000);
        const request = createMockRequest("POST", longToken, longToken);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should handle special characters in tokens", () => {
        const token = "token-with-special_chars.123!@#";
        const request = createMockRequest("POST", token, token);
        expect(validateCSRF(request)).toBe(true);
      });

      it("should be case-sensitive for token comparison", () => {
        const request = createMockRequest("POST", "TokenABC", "tokenABC");
        expect(validateCSRF(request)).toBe(false);
      });

      it("should handle different pathname correctly", () => {
        const token = "test_token";
        const request = createMockRequest("POST", token, token, "/admin/users/delete");
        expect(validateCSRF(request)).toBe(true);
      });
    });
  });

  describe("requiresCSRF", () => {
    it("should return true for POST", () => {
      expect(requiresCSRF("POST")).toBe(true);
    });

    it("should return true for PUT", () => {
      expect(requiresCSRF("PUT")).toBe(true);
    });

    it("should return true for PATCH", () => {
      expect(requiresCSRF("PATCH")).toBe(true);
    });

    it("should return true for DELETE", () => {
      expect(requiresCSRF("DELETE")).toBe(true);
    });

    it("should return false for GET", () => {
      expect(requiresCSRF("GET")).toBe(false);
    });

    it("should return false for HEAD", () => {
      expect(requiresCSRF("HEAD")).toBe(false);
    });

    it("should return false for OPTIONS", () => {
      expect(requiresCSRF("OPTIONS")).toBe(false);
    });

    it("should handle case-insensitive method names", () => {
      expect(requiresCSRF("post")).toBe(true);
      expect(requiresCSRF("get")).toBe(false);
      expect(requiresCSRF("PaTcH")).toBe(true);
    });

    it("should return false for unknown methods", () => {
      expect(requiresCSRF("CONNECT")).toBe(false);
      expect(requiresCSRF("TRACE")).toBe(false);
    });
  });
});
