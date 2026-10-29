# Polarity Maps: plain-text part format

A short text format for writing down a module, cable or patch cord, by hand or from a product drawing. Each block can then be added to the site.

Status: **draft**. The section on key up and key down is still open (see the end).

## The idea

Each part is one block. A block has:
- a header in square brackets
- a few `Key: value` lines, one per line
- one row per fibre, written as `from-to`

Blank lines separate blocks. Anything after `#` on a line is a comment.

## [Module]

A cassette or module with front ports and one MPO at the rear.

```
[Module]
Name: Universal 12F
Front: LC/APC
MPO: MPO/APC-12F-Down
SRC: drawing name or number
1-1
2-12
3-2
4-11
5-3
6-10
7-4
8-9
9-5
10-8
11-6
12-7
```

| Line | Meaning |
|---|---|
| `Name:` | What the part is called on the site. |
| `Front:` | Front connector and polish: `LC/UPC`, `LC/APC`, `SC/APC`, `CS/UPC`, `SN/UPC` … |
| `MPO:` | Rear MPO, written `MPO/<polish>-<size>F-<key>`. `<size>` is the number of positions in the MPO (12, 16 or 24). `<key>` is `Down` or `Up` (see the open question). An optional `-F` on the end marks a female rear MPO; male is the default. |
| `SRC:` | Where the map came from (drawing, data sheet, reference section). Required. |
| `Status:` | Optional: `VERIFIED`, `PARTIAL` or `UNVERIFIED`. Default `UNVERIFIED` until it has been checked against the drawing or `docs/polarity-reference.md`. |
| rows | `port-MPO position`. One row per front port. |

**Ports:**
- Each front port has its own number, as printed on the module.
- Ports 1 and 2 sit side by side as one Tx/Rx pair, as do 3 and 4, and so on.

**Unused MPO positions:**
- The MPO size comes from the `MPO:` line, not from the number of rows.
- Any MPO position with no row is unused, and the site draws it as an empty grey position.
- For example, an 8-port module on a 12F MPO with positions 5–8 unused:

```
[Module]
Name: Type A 8F
Front: LC/UPC
MPO: MPO/UPC-12F-Down
SRC: drawing name or number
1-1
2-2
3-3
4-4
5-9
6-10
7-11
8-12
```

The site labels this `MPO-12 · 8F`.

## [Assembly]

An MPO cable (trunk). Each row is `position at end 1-position at end 2`.

```
[Assembly]
Name: Type B trunk
MPO: MPO/APC-12F-F/F
SRC: drawing name or number
1-12
2-11
3-10
4-9
5-8
6-7
7-6
8-5
9-4
10-3
11-2
12-1
```

| Line | Meaning |
|---|---|
| `Name:` | What the part is called on the site. |
| `MPO:` | `MPO/<polish>-<size>F-<end 1 gender>/<end 2 gender>`. Gender is `F` (female, no pins) or `M` (male, pinned). Trunks are usually `F/F`. |
| `SRC:`, `Status:` | As for modules. |
| rows | `end 1 position-end 2 position`. Leave out empty positions (an 8F trunk has 8 rows). |

## [Cord]

A duplex patch cord. Each row is `fibre at the module end-fibre at the equipment end`.

```
[Cord]
Name: LC A-to-B (standard)
Ends: LC/UPC-LC/UPC
SRC: drawing name or number
1-2
2-1
```

```
[Cord]
Name: LC A-to-A
Ends: LC/UPC-LC/UPC
SRC: drawing name or number
1-1
2-2
```

`Ends:` is the module end first, then the equipment end, for example `CS/UPC-LC/UPC`.

## Checks the site runs on every block

1. Every line is understood. Unknown keys or bad rows are rejected, never guessed.
2. No MPO position is used twice, and no position is larger than the MPO size.
3. No port is listed twice. Ports run 1, 2, 3 … with no gaps, and come in pairs.
4. `Front:`/`Ends:` connectors are ones the site knows. Polish is `UPC` or `APC`.
5. Polish rule: `Up` with `APC` is refused, because an angled MPO cannot mate key-up to key-up.
6. Without a `Status:` line the part is shown as unverified.

## Examples from the current site

Type A module: rows `1-1` to `12-12`, `MPO: MPO/APC-12F-Down`.

Universal module (U1): the rows in the first example above, `MPO: MPO/APC-12F-Down`.

Universal 8F: `1-1, 2-12, 3-2, 4-11, 5-3, 6-10, 7-4, 8-9`, `MPO: MPO/APC-12F-Down`.

Method B module: rows `1-1` to `12-12`, `MPO: MPO/UPC-12F-Up`.

8-port CS module: `Front: CS` (polish not yet confirmed), `MPO: MPO/APC-16F-Down`. The rows are still waiting on the product drawing; the site's current guess is `1-1, 2-16, 3-2, 4-15 … 15-8, 16-9`.

Type A trunk: rows `1-1` to `12-12`, `MPO: MPO/APC-12F-F/F`.

Type C trunk: `1-2, 2-1, 3-4, 4-3 … 11-12, 12-11`.

## Open question: key up and key down

How the current site reads it:
- An MPO plug has a small bump (the key) on one side.
- The rear adapter of a module joins the module's internal MPO to the trunk's MPO.
- **`Down` = key-up/key-down adapter** (TIA Type A adapter). The two keys face opposite ways, so position 1 meets position 1. Almost every module uses this, and it is the only type allowed with APC.
- **`Up` = key-up/key-up adapter** (TIA Type B adapter). Both keys face the same way, so position 1 meets position 12. This is used in Method B, with UPC only.

To be confirmed with the owner before this spec is final:
- whether `Down`/`Up` is the right way to name these
- how the owner's products are labelled
