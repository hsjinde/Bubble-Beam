"""Reed-Solomon decoding over GF(256) for QR codes.

Berlekamp-Massey for the error locator, Chien search for positions, Forney for
magnitudes. Generator roots are a^0..a^(n-1), matching QR's convention.
Returns the corrected codewords plus the number of symbols actually repaired,
which the decoder reports as evidence of how marginal a read was.
"""

from qrspec import GF_EXP, GF_LOG, gf_mul, gf_div, gf_inv, poly_eval, poly_mul


class ReedSolomonError(Exception):
    pass


def calc_syndromes(msg, ec_len):
    """Syndromes S_i = msg(a^i) for i in 0..ec_len-1."""
    return [poly_eval(msg, GF_EXP[i]) for i in range(ec_len)]


def berlekamp_massey(syndromes, ec_len):
    """Return the error-locator polynomial (highest degree first)."""
    # Work with lowest-degree-first internally, it keeps the recurrence simple.
    c = [1]  # current locator
    b = [1]  # previous locator
    l = 0
    m = 1
    bb = 1
    for n in range(ec_len):
        d = syndromes[n]
        for i in range(1, l + 1):
            if i < len(c):
                d ^= gf_mul(c[i], syndromes[n - i])
        if d == 0:
            m += 1
        elif 2 * l <= n:
            t = list(c)
            scale = gf_div(d, bb)
            shifted = [0] * m + [gf_mul(x, scale) for x in b]
            if len(shifted) > len(c):
                c = c + [0] * (len(shifted) - len(c))
            for i, v in enumerate(shifted):
                c[i] ^= v
            l = n + 1 - l
            b = t
            bb = d
            m = 1
        else:
            scale = gf_div(d, bb)
            shifted = [0] * m + [gf_mul(x, scale) for x in b]
            if len(shifted) > len(c):
                c = c + [0] * (len(shifted) - len(c))
            for i, v in enumerate(shifted):
                c[i] ^= v
            m += 1
    # strip and convert to highest-degree-first
    while len(c) > 1 and c[-1] == 0:
        c.pop()
    return list(reversed(c))


def find_error_positions(locator, msg_len):
    """Chien search: roots of the locator give error positions."""
    errs = len(locator) - 1
    positions = []
    for i in range(msg_len):
        # position i counted from the end of the message
        if poly_eval(locator, gf_inv(GF_EXP[i])) == 0:
            positions.append(msg_len - 1 - i)
    if len(positions) != errs:
        raise ReedSolomonError(
            "error locator degree %d but found %d roots" % (errs, len(positions))
        )
    return positions


def forney(syndromes, locator, positions, msg_len):
    """Compute error magnitudes and return them keyed by position."""
    # Syndrome polynomial, highest degree first.
    synd_poly = list(reversed(syndromes))
    ec_len = len(syndromes)
    # Omega = S(x) * Lambda(x) mod x^ec_len
    omega_full = poly_mul(synd_poly, locator)
    omega = omega_full[-ec_len:] if len(omega_full) > ec_len else omega_full

    # Formal derivative of the locator (lowest-degree-first is easier here).
    lam_low = list(reversed(locator))
    deriv_low = [lam_low[i] if i % 2 == 1 else 0 for i in range(1, len(lam_low))]
    deriv = list(reversed(deriv_low))

    magnitudes = {}
    for pos in positions:
        xi = GF_EXP[(msg_len - 1 - pos) % 255]
        xi_inv = gf_inv(xi)
        num = poly_eval(omega, xi_inv)
        den = poly_eval(deriv, xi_inv)
        if den == 0:
            raise ReedSolomonError("Forney denominator vanished at position %d" % pos)
        # Roots are a^0.., so the magnitude carries an extra X_k factor:
        #   e_k = X_k * Omega(X_k^-1) / Lambda'(X_k^-1)
        magnitudes[pos] = gf_mul(xi, gf_div(num, den))
    return magnitudes


def rs_correct(codewords, ec_len):
    """Correct a block of codewords (data followed by EC).

    Returns (corrected_list, num_errors_corrected).
    Raises ReedSolomonError when the block has more errors than can be repaired.
    """
    msg = list(codewords)
    syndromes = calc_syndromes(msg, ec_len)
    if all(s == 0 for s in syndromes):
        return msg, 0

    locator = berlekamp_massey(syndromes, ec_len)
    num_errors = len(locator) - 1
    if num_errors == 0 or num_errors * 2 > ec_len:
        raise ReedSolomonError(
            "too many errors to correct (locator degree %d, capacity %d)"
            % (num_errors, ec_len // 2)
        )

    positions = find_error_positions(locator, len(msg))
    magnitudes = forney(syndromes, locator, positions, len(msg))
    for pos, mag in magnitudes.items():
        if not (0 <= pos < len(msg)):
            raise ReedSolomonError("error position %d out of range" % pos)
        msg[pos] ^= mag

    # Verify: a corrected block must have all-zero syndromes.
    if any(s != 0 for s in calc_syndromes(msg, ec_len)):
        raise ReedSolomonError("correction failed verification")
    return msg, len(positions)
