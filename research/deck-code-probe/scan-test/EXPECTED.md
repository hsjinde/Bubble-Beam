# Expected scan results

Scan each file and compare what your scanner shows against the
expected text below. Report anything that fails to scan at all,
and anything whose text comes back different.

## code1-v1-L.png

- QR version 1, level L, mask 3, 21 x 21 modules
- probing: smallest symbol, no alignment pattern, no version info block
- expected text:

```
PTCGP PROBE 1
```

## code2-v2-M.png

- QR version 2, level M, mask 0, 25 x 25 modules
- probing: byte mode with punctuation; first version that has an alignment pattern
- expected text:

```
PROBE 2 ~!@#$%^&*()_+{}
```

## code3-v7-Q.png

- QR version 7, level Q, mask 4, 45 x 45 modules
- probing: version information blocks (only present from version 7 up)
- expected text:

```
PROBE 3 -- version 7 carries an explicit version information block in two corners.
```

## code4-v10-H.png

- QR version 10, level H, mask 4, 57 x 57 modules
- probing: level H interleaving across many blocks, multiple alignment patterns
- expected text:

```
PTCGP PROBE 4 -- level H, multiple alignment patterns and a different block interleaving layout.
```

## code5-utf8.png

- QR version 4, level M, mask 2, 33 x 33 modules
- probing: high bytes / UTF-8 payload, verifies byte mode is not ASCII-only
- expected text:

```
PTCGP PROBE 5 波加曼 ポッチャマ Piplup
```

## code6-v15-H.png

- QR version 15, level H, mask 4, 77 x 77 modules
- probing: THE DECIDING ONE: v15-H, where our table and the reference disagreed
- expected text:

```
PTCGP PROBE 6 -- version 15 at level H. This is the exact combination where the reference implementation's block table disagreed with the geometry, so a successful scan here settles which one was right.
```
