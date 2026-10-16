# polarity-reference.md — MPO / Duplex Fibre Polarity Reference for Polarity Trace

A Tx→Rx link works only if the whole channel contains an **odd number of polarity inversions**. Every TIA method (A, B, C, U1, U2) is just a different place to put that one inversion. The engine can be built on that single rule, plus exact per-component position maps. The 12-fibre maps, the TIA methods, the universal (U1/U2) cassettes and the main parallel-optic lane assignments are well corroborated. MPO-24, MPO-16 cable maps and conversion-cord maps are only partly verified and must be confirmed against TIA-568.3-E or the manufacturer's own drawings before they become unit tests.

## TL;DR
- **Engine rule:** model each component as a position-mapping function. A duplex channel passes when the composed map sends each transceiver Tx to the far-end Rx at the *same* port number. A parallel (array) channel passes when it contains an odd number of Type-B (reversing) elements and no unmatched Type-C pair flips. TIA-568.3-E (published September 2022) defines five sample methods: A, B, C, U1 and U2. U1 and U2 are duplex-only. A, B and C also support array (MPO-to-MPO) signals.\[1\]\[2\]
- **Verified (≥3 independent sources):**
  - 12F Type A (1→1, key-up→key-down), Type B (1→12, key-up→key-up) and Type C (pair-flipped).\[3\]\[4\]
  - Method A/B/C component sets.
  - The universal cassette map MPO 1,12,2,11,3,10,4,9,5,8,6,7 → LC 1–12. This is TIA's Type-U1 transition, used with a Type-B trunk and A-to-B cords at both ends.
  - SR4/DR4/PSM4 parallel optics: Tx on positions 1–4, Rx on 9–12, centre 4 dark.
  - SR8/DR8 on MPO-16: Tx 1–8, Rx 9–16.
  - Transceiver MPO ports are pinned (male).\[5\]
- **Not yet verified to the 3-source bar** (revision 1 list; see the Revision 2 table below for what changed):
  - MPO-24 row-swap maps (only one full table found, from a competitor).
  - MPO-16 cable Type A/B maps (derived, not published by a non-competitor).
  - 2×12F→3×8F and 24F→2×12F conversion maps (no published map found).
  - Colour-code edge cases: ANSI/TIA-598-D lists fibre 20 as black with a white tracer (a yellow tracer is also allowed). The MPO-16 colours for positions 13–16 come from ANSI/TIA-598-D-1 (2018 addendum), cited via FOA; this pass did not check them against the standard text.
  
  Treat these as engineering-review items, not tests.
- **Revision 3:** at the equipment port Tx = Position B, Rx = Position A (VERIFIED). A plug mated into an optic MPO receptacle transposes i ↔ 13−i. In the v1 layout (parallel optic → trunk → cassette → cord → duplex optic), **U1 and U2 behave the same: over a Type B trunk both need A-to-A cords for breakout.** The far-end B2 Method B map is 11,12,9,10,7,8,5,6,3,4,1,2 (PARTIAL). See "Revision 3" below.

## Revision 2 (2026-10-16): follow-up research merged

This revision answers the 14 open questions from revision 1. Changes, corrections first:

| # | Change | Where |
|---|---|---|
| C-1 | **Correction.** 400G BiDi (400GBASE-SR4.2, QDD-400G-SR4.2-BD) is **MPO-12** (pairs 1–4 and 9–12), not duplex LC. Duplex-LC BiDi examples are QSFP-100G-SR1.2 and QSFP-40/100-SRBD. | §6.1, §6.2 |
| C-2 | **Confirmed.** 24F Type A trunk maps position 1 → **13** (rows swap), not 1→1. Type A is now VERIFIED; Type B (1→24) and Type C (1→14) stay PARTIAL. | §2.6 |
| C-3 | **Source correction.** "Precision OT" pages carry Belden branding, so they are reclassified as a **competitor** source. | §1, §2.6 |
| C-4 | **Correction.** 100GBASE-SR4 reach is 70 m OM3 / 100 m OM4 (IEEE Cl. 95). The TIA FOTC table's 100/150 m is wrong. | §6.7 |
| C-5 | **Behaviour change.** A key-up/key-up adapter on an APC link is now **BLOCK**, not a warning. Method B and U2 cannot be built in APC. Mixing APC and UPC on one mate is also BLOCK. | §3 |
| C-6 | **Confirmed.** Full U2 order is 12,1,11,2,10,3,9,4,8,5,7,6. | §4.4 |
| N-1 | **New.** Derived single-MPO universal maps for MPO-16 (8 ports), MPO-24 (12 ports) and MPO-24 · 16F (8 ports). | §4.3a |
| N-2 | **New.** Duplex Tx is on the **left**, looking into the module receptacle with the keyway or latch on top (QSFP-DD MSA). | §6.6 |
| N-3 | **New.** Label scheme "MPO-<positions> · <lit>F". | §1.1 |
| N-4 | **New.** Polish defaults (APC on SM, UPC on MM) with a per-optic exception list. | §6.0 |
| N-5 | **New.** Method B in practice: an inverted far cassette or a B1/B2 pair. F-5 is now WARN. | §4.1, §8 |
| N-6 | **New.** 24F straight-cassette behaviour, harness leg convention, colour table and reach table. | §4.5, §5.4, §10, §6.7 |

## Revision 2.1 (2026-10-16): interim reasoning, not yet sourced

> **Revision 3 status:** §2.1-2 and §2.1-4 are superseded by revision 3. The v1 note in §2.1-1 is **wrong** (see R3-3). The patch-field explanation in §2.1-1 is superseded by §3-1. §2.1-3 still stands, and its item (iii) is resolved by §3-2.

The research chat worked through the four follow-up questions from position algebra while a sourced research run was unavailable. Items marked **(algebra)** are derivations and can be relied on as logic. Items marked **(needs source)** are provisional. A sourced run will follow.

### 2.1-1 Mixing U1 and U2 (algebra)
- Seen from the trunk, "U1 transition + Type A adapter" and "U2 transition + Type B adapter" are the same black box. U1 at one end and U2 at the other over a Type B trunk therefore **passes**. F-U1U2-MIX is revised to WARN "mixed methods" (BLOCK if APC).
- **Why Fluke says U1 breakout needs A-to-A:** in a patch field, a parallel optic reaches the trunk through an MPO equipment cord and a pass-through panel adapter. That adapter's type follows the method: Type A in a U1 system, Type B in a U2 system. Tracing SR4 lane *k* (Tx at position *k*) with a Type B equipment cord:

| System | Equipment cord → panel adapter → trunk | Arrives at cassette | Cassette port *k* | A-to-B cord → far optic | Result |
|---|---|---|---|---|---|
| U1 | Type B → Type A → Type B: net straight | position *k* | fibre A | lands on optic B (Tx) | ❌ Tx→Tx; needs A-to-A |
| U2 | Type B → Type B → Type B: net reversed | position 13−k | fibre B | lands on optic A (Rx) | ✅ |

  The cassette black box is identical in both rows. The extra Type B adapter in the U2 patch field makes the whole difference.
- **Engine rule:** model every MPO-to-MPO pass-through adapter as its own component and let each preset set its type. Cassettes need no special U1/U2 flag.
- ~~**v1 note (derived in this repo):**~~ **WRONG, corrected in revision 3 (R3-3):** this trace left out the plug-to-receptacle transposition (§3-1 rule 5). The correct result is FAIL with A-to-B cords and PASS with A-to-A (BO-01/BO-02). Original text kept for the record: in v1 the MPO optic plugs straight into the single trunk, with no equipment cord or panel adapter. Then SR4 → Type B trunk → U1 cassette (Type A rear adapter) lands lane *k* on port *k* fibre B, and an A-to-B cord delivers it to the far optic's A (Rx): **PASS** with standard cords. This holds only under the Tx = B convention in §2.1-2.

### 2.1-2 Duplex A and B at the equipment port (algebra + needs source)
- **Proposed convention:** at every duplex optic, Tx = position B and Rx = position A. This matches Fluke's quote of TIA, "the Tx (B) should always connect to the Rx (A)".
- **Correction (from this repo's review):** the interim note said this is "the only labelling under which a single A-to-B cord between two optics passes". That is not right. Any labelling applied the same way at both optics passes with an A-to-B cord. **Where the convention matters is breakout** (parallel optic on one side, cassette + duplex optic on the other). There the cassette's A/B labels and the optic's A/B labels meet, and Tx = A versus Tx = B flips the verdict. So the convention must be confirmed with a TIA figure, not inferred.
- Left/right is for drawing only. The engine tracks A/B; rendering uses left/right.
- **(needs source)** Whether position B is the left bore looking into a module with the latch up. The QSFP-DD MSA puts Tx on the left, which suggests B = left.

### 2.1-3 The inverted Method B cassette (algebra)
- **A and B travel with the key, not with left/right.** When a cassette is turned upside down:
  - each front LC adapter rotates 180°, and the cord plug goes in latch-down, so label A still mates with label A. The cord carries a half twist, which doesn't change its fibre map;
  - the rear key-up/key-up adapter, flipped over, is still aligned-key (both keys now point down), so it is still Type B. The trunk plug goes in key-down, which is also just a twist.
- So in label terms an inverted cassette behaves exactly like an upright one; only the physical slot of each printed port changes. Trace of near port 1, fibre A:

| Step | Component | Position after this step |
|---|---|---|
| 1 | Near optic Tx = B, through an A-to-B cord | Near cassette port 1, A (LC fibre 1) |
| 2 | Straight transition | Internal MPO 1 |
| 3 | Type B rear adapter | Trunk end 1, position 12 |
| 4 | Type B trunk | Trunk end 2, position 1 |
| 5 | Far Type B adapter (flipped with the inverted cassette, still Type B) | Far internal MPO 12 |
| 6 | Straight transition | LC fibre 12 = printed port 6, B |
| 7 | A-to-B cord | Far optic A = Rx ✅ |

- **(i) Two upright cassettes:** light reaches Rx, but port 1 arrives at printed port 6 (7−p). WARN, port mismatch.
- **(ii) Far cassette inverted:** printed port 6 sits in physical slot 1, so slot *p* → slot *p* and Tx → Rx. **PASS**, with a note that printed labels read 7−p.
- **(iii) B1/B2 pair (needs engineering):** a plain reversal far-end cassette (LC 1–12 = MPO 12…1) puts port 1 on port 1 fibre **A**, which is Tx→Tx: FAIL. A working far-end cassette must reverse the ports but keep each pair's A/B order: **LC 1–12 = MPO 11, 12, 9, 10, 7, 8, 5, 6, 3, 4, 1, 2**. The competitor "Method B BN" drawing in §4.1 (MPO 12, 11 … 1 → LC 1 … 12) looks like a plain reversal; check the real far-end map before adding this preset. (Checked in this repo: with that map, near MPO 1 → far internal 12 → LC 2 = port 1 B, and near MPO 2 → far internal 11 → LC 1 = port 1 A. Port 1 → port 1, crossed. ✅)

### 2.1-4 Optic interoperability (needs source; UNVERIFIED)
A pair of optics passes only if the light lands correctly **and** both optics share an interoperability group.

| Parallel optic | Valid far-end duplex optics | Conditions | Common look-alikes that don't work |
|---|---|---|---|
| 40G SR4 (4×10G NRZ, 850 nm, MM) | 4× 10GBASE-SR | Switch port set to 4×10G breakout; reach limited to the SR4's 100/150 m | 10G LR or LRM (singlemode, different wavelength) |
| 100G SR4 (4×25G NRZ) | 4× 25GBASE-SR | 25G side needs RS-FEC | 4× 10G SR: only on some platforms, not standard |
| 400G DR4 (4×100G PAM4, 1310 nm, SM) | 4× 100G DR, also 100G FR1 and LR1 | Same single-wavelength 100G PAM4 lanes; reach capped at DR4's 500 m | 100G CWDM4 or FR4 (4-wavelength); 100G PSM4 (25G NRZ lanes) |
| 400G SR4.2 BiDi | 4× 100G SR1.2 | BiDi to BiDi only | 40/100G SR-BiDi; 400GBASE-SR4 (802.3db) |
| 400G SR8 (8×50G PAM4) | 8× 50G SR; 2× 200G SR4 on some platforms | PAM4 at both ends | 25G SR (NRZ) |
| 400GBASE-SR4 (802.3db, 4×100G MM) | 4× 100GBASE-SR1 | Same 850 nm 100G lanes | 400G SR4.2; 100G SR1.2 |
| 800G 2×DR4 / DR8 | 2× 400G DR4 or 8× 100G DR | 100G-per-lane PAM4 | Lane-rate mismatches |

- **Optic data fields:** `fibreType`, `wavelengthScheme` (SR, BiDi, SWDM, single-wavelength, 4-wavelength), `laneRate`, `modulation` (NRZ / PAM4), `interopGroup`, `breakoutModes`.
- **General mismatches to catch:** MM optics on SM fibre; 850 nm SR with SWDM; BiDi with non-BiDi; NRZ lanes with PAM4 lanes (e.g. 25G NRZ against 50G PAM4).

### 2.1 open items for the next sourced run
1. TIA figure for duplex A/B at the equipment port, and whether B is the left bore (latch up). This decides breakout verdicts (§2.1-2). **→ Answered in revision 3 (§3-1).**
2. A real published far-end (B2) Method B cassette map (§2.1-3 iii). **→ Answered in revision 3 (§3-2), PARTIAL.**
3. Sources for the interoperability table (§2.1-4). **→ Answered in revision 3 (§3-3).**

## Revision 3 (2026-10-16): sourced answers to the 2.1 open items

This revision answers the three 2.1 open items with sources. It **supersedes §2.1-2 and §2.1-4**, corrects the v1 note in §2.1-1, and resolves the 2.1-3(iii) hold. Where this section and an older section disagree, this section wins.

| # | Topic | Conclusion | Change to the reference |
|---|---|---|---|
| R3-1 | A/B at the equipment port | **Tx = Position B, Rx = Position A.** Looking into a receptacle (optic port or adapter port) from the patching side, latch/keyway up: B left, A right. Looking at a plug end face, latch up: A left, B right. | New normative rule (§3-1). No effect on duplex-to-duplex verdicts: the odd-inversion rule holds whichever label is Tx, as long as both optics use the same one. |
| R3-2 | MPO plug into an optic receptacle | Mating a plug into an optic MPO receptacle (aligned keys) **transposes laterally: receptacle i ↔ plug 13−i**. This is the same algebra as a Type B adapter. | New normative rule (§3-1, rule 5). It cancels out on optic-to-optic links, so no existing parallel result changes. |
| R3-3 | U1 vs U2 breakout in the v1 layout (optic → trunk → cassette → cord → duplex optic) | U1 (Type A rear adapter) and U2 (Type B rear adapter) behave the same. **Over a Type B trunk both need A-to-A cords.** Over a Type A trunk both pass with A-to-B cords, but that is a mixed method (WARN). Straight cassettes always FAIL breakout. | **Correction.** The vendor claim "U2 supports breakout with standard cords" applies only when the U2 transition's own MPO plugs straight into the optic (harness / direct transition), not through a trunk. It also **corrects this repo's v1 note in §2.1-1**, which missed the R3-2 transposition and wrongly concluded PASS with standard cords. |
| R3-4 | Far-end (B2) Method B map | LC 1–12 = MPO 11,12,9,10,7,8,5,6,3,4,1,2; key-up/key-up rear adapter; Type B trunk; paired with B1 = straight. | Confirms the derived map in §2.1-3(iii). The plain-reversal "BN" drawing FAILS with A-B front adapters and PASSES only with B-A front adapters. Status PARTIAL (one numeric source, a competitor). |
| R3-5 | TIA's own form of Method B duplex | TIA-568.3-D shows one Type-A transition, mounted inverted at one end. Matched B1/B2 pairs are a vendor alternative TIA does not define. | Confirms §4.1. |
| R3-6 | Interoperability table | Rows confirmed with conditions (FEC, reach, MPO-16 scope, platform modes). Several rows PARTIAL. | Replaces the §2.1-4 table (§3-3). |

**Repo check (this repo, 2026-10-16).** All 16 breakout combinations in §3-1 (2 trunks × 4 cassette/adapter builds × 2 cords) and all four Method B cases in §3-2 were re-traced independently with a script. Every result matches. One consistency point, recorded as open item R3-O8: the U1/U2 verdicts in the v1 layout come out the same under either reading of R3-2, as long as the convention reproduces Fluke's direct-breakout statement. **Which cable fibre colour carries Tx** does depend on R3-2, though, and the Juniper harness table in §5.4 ("1 – Tx on LC Duplex 1") reads as if plug position 1 carries Tx, which would contradict R3-2.

### 3-1 TIA A/B position at the equipment port

**Direct answer.** At a transceiver or equipment port the transmitter is **Position B** and the receiver is **Position A**. Positions are defined by the key, or for latched connectors by the latch, not by left or right. With the port viewed from the patching side and the latch/keyway up, B (Tx) is on the left and A (Rx) is on the right. A TIA-labelled duplex LC plug inserted latch-up therefore puts its B ferrule into the optic's left (Tx) bore and its A ferrule into the right (Rx) bore.

**Status: VERIFIED** (TIA text, Fluke Networks, USPTO patent, three MSAs; competitor cross-check). The INF-8074i SFP optical-interface figure was not retrieved and remains open.

| Source | What is drawn or stated | Orientation and labels |
|---|---|---|
| TIA/EIA-568-B.3 (2000), §5.2.4.1, Figure 1 "Position A and B configuration of a 568SC" | Duplex SC connector and adapter, with Positions A and B shown relative to keys and keyways. Text: "the 568SC adapter shall perform a pair-wise crossover between connectors". | §5.2.4.2: "For alternate connector designs utilizing latches, the latch defines the positioning in the same manner as the key and keyways." |
| TIA/EIA-568-B.3 §6.4, Figure 2 "Optical fiber patch cord" | The cord shall be "of an orientation such that Position A goes to Position B on one fiber, and Position B goes to Position A on the other". | **"For simplex connectors, the connector that plugs into the receiver shall be considered Position A, and the connector that plugs into the transmitter shall be considered Position B."** This is the TIA root of the Tx = B rule. |
| ANSI/TIA-568.3-D (2016), §5.2.1.3 Figure 3; §6.4.2.1 Figure 6 "A-to-B duplex patch cord"; §6.4.2.2 Figure 7 "A-to-A duplex patch cord" | Figures 6 and 7 show duplex SC cords, each end annotated "Keys are up". Figure 6 crosses A→B; Figure 7 runs A→A. "SC connectors are shown, but this assembly may be built using any duplex single-fiber connectors". A-to-A cords "shall be clearly identified (by color or prominent labeling)" and "should be used only when necessary as part of a polarity method". | Same latch rule repeated in §5.2.1.3.2 and §6.4.2.1. |
| ANSI/TIA-568.3-D Annex C, Figures 22–25 | Consecutive-fiber positioning: adapters A-B, A-B… at one end and B-A, B-A… at the other, fibres 1, 2, 3, 4… at both ends. Reverse-pair positioning: same adapter orientation both ends, fibres 1, 2, 3, 4… at one end and 2, 1, 4, 3… at the other. | Adapter A/B orientation is a deployment choice, so cassettes must declare it. |
| Senko application note "Fiber Optic Polarity Guide for VSFF Connectivity" (Rev. 01, Oct 2023), Figures 1–4, reproduced from TIA-568.3-D with permission | "the connector in the 'B' position should always connect to the connector in the 'A' position". | Applies to LC, SC and CS. Excludes vertical SN/MDC. |
| Fluke Networks, "Fiber Polarity Basics for Duplex Applications" (Nov 2025) | **"the Tx (B) should always connect to the Rx (A), regardless of how many patch panel adapters or cable segments are in the channel."** | Refers to equipment Tx/Rx at the channel ends, matching TIA-568-B.3 §6.4. |
| USPTO US12130480B2 "Polarity scheme for multi-fiber connectors with a connector key" | Duplex LC uniboot: "The 'A' ferrules are always located on the right side … (with the connector key 18 in the upward facing position) and connect to the receiver (RX), while the 'B' ferrules are always located on the left side … and connect with the transceivers (TX)." | Independent restatement: B = Tx, left, key up. |
| Leviton blog "Fiber Optic Polarity 101: A-B Polarity" (competitor) | "When facing an open port in the 'Keyup' position, 'B' will always be on the left and 'A' will always be on the right." | Cross-check only. |
| QSFP-DD MSA Hardware (Rev 7.0 §5.2, Fig. 15; Rev 6.3 Fig. 27) | "The transmit and receive optical lanes shall occupy the positions depicted … when looking into the MDI receptacle with the connector keyway feature on top." | Duplex LC: Tx left, Rx right. MPO-12: Tx at 1–4, Rx at 9–12. |
| SFP-DD MSA Hardware Rev 4.2 Fig. 14 / Rev 5.2 Fig. 16 | Same note for dual LC and MPO-12. | Consistent with QSFP-DD. |
| QSFP+ hardware specification (SFF-8436 family), §5.10, Figs. 21a/21b | "The four fiber positions on the left … with the key up, are used for the optical transmit signals (Channel 1 through 4). The fiber positions on the right are used for the optical receive signals (Channel 4 through 1)." Also: "Aligned key (Type B) MPO patchcords should be used". | Rx lane k at position 13−k. |

**Cassette front adapter and panel orientation**
- A cassette's front duplex LC adapter, installed upright (latch slot up) and viewed from the front, follows the receptacle convention: **B left, A right**.
- TIA lets the installer choose the adapter A/B orientation per end, so which MPO fibre goes to A is a property of the cassette design and must be stored.
- **Engine convention (normative):** LC odd fibre = Position A. Straight transition: port p A = MPO 2p−1. U1: port p A = MPO p, B = MPO 13−p. This matches Senko's reproduction of the U1 transition ("MPO Position 1 to LC Position 1 – MPO Position 12 to LC Position 2"). Under it the engine reproduces the industry statement that U1 needs A-to-A cords for direct breakout, which supports the convention.

**Final convention (normative for the engine)**
1. A/B labels attach to the key or latch, not to left/right (TIA-568.3-D §5.2.1.3.2).
2. Equipment port: Tx = B, Rx = A (TIA-568-B.3 §6.4).
3. Rendering a receptacle (optic port or adapter port) viewed from the patching side, latch/keyway up: B on the left, A on the right. Rendering a plug end face, latch up: A on the left, B on the right.
4. MPO parallel optic receptacle viewed keyway up: Tx lane k at position k (k = 1–4), Rx lane k at position 13−k.
5. Mating a plug into an optic MPO receptacle (aligned keys) transposes laterally: receptacle i ↔ plug 13−i. Same algebra as a Type B adapter. This reproduces the NVIDIA SR4 specification: "position 1 of MPO connector A at the near end connects to position 12 of the far end MPO connector B" via a Type B cable.

**Step-by-step traces: v1 direct breakout (SR4 → trunk → cassette → duplex cord → duplex optic)**

Notation: R = optic receptacle position; P = trunk plug position; I = cassette internal MPO position after the rear adapter.

*Case (a)(i): Type B trunk, U1 cassette, Type A rear adapter, lane k Tx*

| Step | Component | Input | Output | Note |
|---|---|---|---|---|
| 1 | SR4 Tx lane k | — | R k | Tx source |
| 2 | Receptacle-to-plug mate | R k | P 13−k | lateral transposition |
| 3 | Type B trunk, f(i) = 13−i | P 13−k | far P k | — |
| 4 | Type A rear adapter, f(i) = i | P k | I k | — |
| 5 | U1 map | I k | LC port k, **Position A** | Tx lands on cassette A |
| 6a | A-to-B cord | cassette A | optic **B = Tx bore** | **FAIL (Tx→Tx)** |
| 6b | A-to-A cord | cassette A | optic **A = Rx bore** | lands on Rx ✔ |
| Return (A-to-A) | Far optic Tx (B) | → cassette B = I 13−k | → P 13−k → near P k → R 13−k | = SR4 Rx lane k ✔ **PASS** |

*Case (a)(ii): Type B trunk, U2 cassette, Type B rear adapter.* Steps 1–3 as above; then far P k → Type B adapter → I 13−k → U2 (A = MPO 13−p) → **port k Position A**. Identical to (a)(i): A-to-B FAIL; A-to-A PASS.

*Case (b)(i): Type A trunk, U1 cassette, Type A rear adapter.* R k → P 13−k → far P 13−k → I 13−k → U1 (B = MPO 13−p) → **port k Position B**. A-to-B: PASS, but WARN as a mixed method (TIA U1 specifies a Type B trunk). A-to-A: FAIL.

*Case (b)(ii): Type A trunk, U2 cassette, Type B rear adapter.* Far P 13−k → I k → U2 (B = MPO p) → **port k Position B**. A-to-B: PASS with WARN (mixed method). A-to-A: FAIL.

*Cases (iii)/(iv): straight cassettes, either trunk, either rear adapter.* Lane-k Tx and Rx never share a duplex port, so **FAIL** whatever cord is used.

| Trunk | Cassette (rear adapter) | Lane-k Tx lands at | A-to-B cord | A-to-A cord |
|---|---|---|---|---|
| Type B | U1 (Type A) | port k, A | FAIL Tx→Tx | **PASS** (WARN: non-standard cord) |
| Type B | U2 (Type B) | port k, A | FAIL Tx→Tx | **PASS** (WARN: non-standard cord) |
| Type A | U1 (Type A) | port k, B | **PASS** (WARN: mixed method) | FAIL |
| Type A | U2 (Type B) | port k, B | **PASS** (WARN: mixed method) | FAIL |
| Type B | Straight (Type A) | fibre k (ports 1–2) | FAIL lane split | FAIL |
| Type B | Straight (Type B) | fibre 13−k (ports 5–6) | FAIL lane split | FAIL |
| Type A | Straight (Type A) | fibre 13−k | FAIL | FAIL |
| Type A | Straight (Type B) | fibre k | FAIL | FAIL |

In every PASS case lane k → front port k, and ports 5–6 are dark for 8-fibre SR4. U2 rows are also BLOCK whenever the link is APC (§3.1).

**Comparison with published guidance.**
- Fluke Networks: "Method U2 also supports direct breakout applications … Using Method U1 for direct breakout applications requires non-standard A-A duplex patch cords."
- CommScope (competitor): "Type-U2 fan-out cables and cassettes offer the additional benefit of supporting direct connections in breakout applications".
- The algebra reproduces both statements only where the transition's MPO mates the optic receptacle directly. There, R k → plug 13−k; U2 puts it on port k A, so an LC leg plugged straight into a duplex optic sends Tx into the Rx bore (PASS), while U1 puts it on port k B, into the Tx bore (FAIL).
- In the v1 layout a trunk sits in between, and U1 and U2 are equivalent through their adapters. **The visualizer should explain this rather than repeat the vendor claim.**

**Status:** derived from VERIFIED primitives (Tx = B; MSA lane positions; TIA trunk/adapter algebra). Needs a bench confirmation (R3-O1).

**Recommended engine fields and visualizer behaviour**
- `port.role`: `"tx" | "rx"`, with `equipmentTxPosition: "B"` as a global constant cited to TIA-568-B.3 §6.4.
- `duplexAdapter.orientation`: `"A-B" | "B-A"`, plus `mount: "upright" | "inverted"`.
- `cassette.frontMap`: `{ port, A: mpoPos, B: mpoPos }[]`; `cassette.rearAdapter`: `"typeA" | "typeB"`.
- `mpoReceptacle.mateTransposition = true` for optic ports (i ↔ 13−i).
- `topology.breakoutStyle`: `"trunk-to-cassette"` (v1) vs `"direct-transition"` (future), with a tooltip explaining why U2's advantage applies only to the latter.
- Rendering: B/Tx on the left of a latch-up port viewed from the front. Flip with the key when the connector is inverted.

### 3-2 A real far-end (B2) Method B cassette map

**Direct answer.** **B1 (near end):** LC n ← MPO n (straight). **B2 (far end):** LC 1–12 ← MPO 11,12,9,10,7,8,5,6,3,4,1,2. Both use **Type B (key-up/key-up)** rear adapters, a **Type B trunk** and A-to-B cords at both ends. This is the pair-preserving reversed map, and it passes port p → port p. **Status: PARTIAL** (one numeric source, a competitor, plus corroborating prose). The TIA form (inverted cassette) is VERIFIED.

| Source | Near-end map | Far-end map | Rear adapter | Matches pair-preserving reversal? |
|---|---|---|---|---|
| FS.com "FHD MTP-12/24 Cassettes Datasheet" (competitor) | B1: inner sequence = port labelling (straight) | B2: top row 12 10 8 6 4 2, bottom row 11 9 7 5 3 1 against port labels 2 4…12 / 1 3…11, i.e. LC1←11, LC2←12, LC3←9, LC4←10 … LC11←1, LC12←2 | Key up to key up (FS white paper: "B1 – Type B Up-to-Up; B2 – Type B Up-to-Up") | **Yes, exactly** |
| FS.com white paper "Understanding Fiber Polarity" (competitor) | "B1 \| 1, 3, 5, 7, 9, 11 and 2, 4, 6, 8, 10, 12" | "B2 \| 12, 10, 8, 6, 4, 2 and 11, 9, 7, 5, 3, 1" | Type B Up-to-Up | Yes (same data) |
| Panduit-sourced white paper "Fiber Polarity in MPO/Cassette Systems" (competitor) | B1 | A "'true' B2 cassette where the port position changes are done within one of the cassettes"; alternatively one cassette turned "upside down" | Key-up/key-up trunk | Prose only |
| Leviton app note "Universal Polarity in 12 Fiber Duplex Applications" (competitor) | "Alpha and Beta", "B1 and B2", "Method B Core and Method B Edge" | — | — | Naming only |
| WB Networks blog | "Requires 2 different MTP/MPO cassettes at each end – B1 and B2" | — | — | Naming only |

No non-competitor numeric map was found (US Conec, Senko, Sylex, Prysmian, Huber+Suhner, R&M, Nexans, Rosenberger, Eaton and Clearfield were searched). FS's grid shows LC fibre numbers without A/B labels; the column reading is the research chat's interpretation of the PDF text.

**Algebraic check (Type B trunk, A-to-B cords both ends)**

| Step | Component | Input | Output | Cumulative A↔B inversions |
|---|---|---|---|---|
| 1 | Near optic Tx (B) → A-to-B cord | optic B | B1 port p, **A** | 1 |
| 2 | B1 map | port p A | I 2p−1 | 1 |
| 3 | Type B rear adapter | I 2p−1 | P 14−2p | 1 |
| 4 | Type B trunk | P 14−2p | far P 2p−1 | 1 |
| 5 | Type B rear adapter (far) | P 2p−1 | I 14−2p | 1 |
| 6 | B2 map (LC 2q ← MPO 14−2q) | I 14−2p | LC fibre 2p = port p, **B** | 2 |
| 7 | A-to-B cord | port p B | far optic **A = Rx** | 3 (odd) → **PASS, port p → p** |

**The competitor "BN" drawing (LC 1…12 ← MPO 12…1, key-up/key-up).** Step 6 becomes LC fibre j ← MPO 13−j, so I 14−2p → fibre 2p−1 = port p **A**: 2 inversions, Tx receives Tx, **FAIL**. The same plain reversal **passes** if the far cassette's front duplex adapters are mounted **B-A** (TIA consecutive-fiber positioning). The BN drawing is incomplete without the front-adapter orientation, not wrong in itself. With a Type A rear adapter the plain reversal lands on port 7−p.

**TIA's form.** ANSI/TIA-568.3-D §C.3.3.1 / Figure 31 ("Connectivity Method B supporting duplex signals"): Type-A transitions "mounted in two orientations such that their duplex adapter key orientation on one end of the link is rotated 180-degrees relative to their adapter key orientation on the other end of the link." TIA FOTC's 568.3-E summary: "Type‑A transitions with Type‑B (key up to key up) array adapters are used with standard A‑to‑B duplex jumpers on both ends." Fluke: "Some manufacturers require two different cassettes for Method B".

**Engine data-model additions**
- `cassette.variant`: `"B1" | "B2" | "BN-plain-reversal"`, with `frontMap` stored explicitly. B2 = `[11,12,9,10,7,8,5,6,3,4,1,2]` as LC 1–12.
- `duplexAdapter.orientation` is required for any reversed-map cassette. Warn when a plain-reversal map has unknown front-adapter orientation.
- `cassette.mount`: `"upright" | "inverted"`. Inverted swaps physical slot order and flips A/B with the key.

### 3-3 Optic interoperability table (replaces §2.1-4)

Mostly confirmed from IEEE-aligned OEM documents (Cisco, Arista, Juniper, Intel, Extreme).

| Parallel optic | IEEE/MSA name & clause | Lane rate & modulation | λ & fibre | Valid far-end duplex optic(s) | Conditions | Invalid look-alikes | Status |
|---|---|---|---|---|---|---|---|
| QSFP+ 40G-SR4 | 40GBASE-SR4 (802.3ba, Cl. 86) | 4×10G NRZ | 850 nm MMF, MPO-12 | 4× 10GBASE-SR (SFP+) | Port breakout mode. Cisco QSFP-40G-SR4: 100 m OM3 / 150 m OM4 in breakout. QSFP-40G-CSR4: 300/400 m. **QSFP-40G-SR4-S "does not support 4x10G breakout"**. ASR 9000 40G MPA ports do not support breakout ("Breakout is supported only on native 100G ports on Tomahawk line cards", Cisco community). IEEE: SR and SR4 are "not precisely compatible, but close enough". (The 30 m limit in Cisco's breakout guide applies only to QSFP-100G-SL4 → SFP-25G-SL/SR-S.) | 10GBASE-LR (1310 nm SMF); 40G-SR-BiDi | VERIFIED |
| QSFP28 100G-SR4 | 100GBASE-SR4 (802.3bm, Cl. 95; Cl. 91 RS-FEC) | 4×25G NRZ | 850 nm MMF, MPO-12 | 4× 25GBASE-SR (SFP28) | Breakout mode and the same FEC both ends. 25GBASE-SR (802.3by Cl. 112) needs **Cl. 108 RS-FEC** for 70/100 m. Cisco SFP-25G-SR-S: BASE-R FEC gives 70/100 m, no FEC gives 30/50 m. | 4×10G-SR (Extreme SLX: "does not support a 4x10G breakout"; Arista lists 4×10G breakout only for PLRL4/PLR4) | VERIFIED |
| QSFP-DD/OSFP 400G-DR4 | 400GBASE-DR4 (802.3bs, Cl. 124) | 4×100G PAM4 | 1310 nm SMF, MPO-12 APC | 4× 100GBASE-DR (802.3cd), 100G-FR1, 100G-LR1 (Lambda MSA / 802.3cu) | Runs at the shortest mutual reach, **500 m** (Arista caps DR/FR/LR interop at the shorter optic's reach; 100G-DR is 500 m). RS(544,514) KP4 FEC. | 100G-CWDM4, LR4, FR4 (4×25G NRZ WDM); 100G-PSM4 (4×25G NRZ) | VERIFIED |
| 400G-DR4+ / XDR4 / 4×FR1 | Lambda MSA 100G-FR ×4 | 4×100G PAM4 | 1310 nm SMF | 4× 100G-FR1 (2 km); 100G-DR (500 m) | Cisco QDD-4X100G-FR-S; Arista XDR4. Interoperates with 400G-DR4 at 500 m. | As for DR4 | VERIFIED |
| 400G-SR4.2 (BiDi) | 400GBASE-SR4.2 (802.3cm) | 8×50G PAM4, 2 λ per fibre | 855/908 nm MMF, MPO-12 UPC | 4× 100G-SR1.2 (QSFP-100G-SR1.2) | Host KP4 FEC (Arista puts the module in FEC bypass). **Arista only:** 400G-SRBD can be software-configured for 4× Arista QSFP-100G-SRBD instead, but not mixed. | Cisco QSFP-40/100-SRBD ("will not interoperate"); 100G-SWDM4; 802.3db 400GBASE-SR4 | VERIFIED (SR4.2 vs 802.3db derived) |
| 400G-SR8 | 400GBASE-SR8 (802.3cm) | 8×50G PAM4 | 850 nm MMF, **MPO-16 APC** | 8× 50GBASE-SR (SFP56); 2× 200GBASE-SR4 (QSFP56) | PMDs IEEE-defined (802.3cd); breakout is platform-supported. Arista needs SR8-C for 8×50G/8×25G. **Out of 12F v1 scope (MPO-16).** | Duplex 100G-SR1 | VERIFIED (scope flag) |
| 400G-SR4 (802.3db) | 400GBASE-SR4 (802.3db) | 4×100G PAM4 | 850 nm MMF, MPO-12 APC | 4× 100GBASE-SR1 (e.g. Cisco QSFP-100G-SR-S) | Breakout cable. VR4 variant: 50 m. | 400G-SR4.2; 100G-SR1.2 | VERIFIED |
| 800G 2×DR4 / DR8 | 800GBASE-DR8 (802.3df) / 2×400GBASE-DR4 | 8×100G PAM4 | 1310 nm SMF, 2× MPO-12 | 2× 400G-DR4/XDR4; 8× 100G-DR / FR | Arista: "Interoperates with 2x 400G-XDR4 … and 8x 100G-FR". 800G optics "are not capable of dual-rate" half-speed operation. | 200G/lane 800G-DR4 (OSFP224) to 100G/lane optics; 50G-PAM4 endpoints | PARTIAL |
| 800G 2×SR4 / 2×VR4 / SR8 | 800GBASE-SR8 / VR8 (802.3df) | 8×100G PAM4 | 850 nm MMF | 2× 400G-SR4/VR4; 8× 100G-SR1/VR1 | Cisco: VR4 "interoperable with 400GBASE-SR4, 800GBASE-VR8 or 800GBASE-SR8 in breakout mode". Connector (MPO-16 vs 2× MPO-12) decides v1 scope. | SR4.2 | PARTIAL |

**False assumptions (test as FAIL or WARN)**

| Assumption | Verdict | Basis |
|---|---|---|
| 100G-PSM4 → 4×25GBASE-LR | **WARN, platform-specific PASS.** Arista: "4x25G to interoperate with 25GBASE-LR up to 500m", same FEC both ends. Corning/Arista cabling reference guide (Corning is a competitor): "QSFP-100G-PSM4 … 4x SFP-25G-LR … 500 m". | Arista 100G Q&A; Corning/Arista guide |
| 100G-SR4 → 4×10G-SR | **FAIL by default** (Extreme: no; Arista: not listed) | Extreme KB; Arista |
| 40G-SR4 → 10GBASE-LR | **FAIL**: 850 nm MMF vs 1310 nm SMF | physics; Cisco data sheets |
| BiDi ↔ non-BiDi; SRBD ↔ SR1.2 ↔ SWDM4 | **FAIL**: "do not interoperate with each other" | Arista 100G Q&A; Cisco SR1.2 AAG |
| 850 nm SR ↔ SWDM4 | **FAIL** | Arista 100G Q&A |
| Multimode optic over singlemode fibre | **FAIL** (fibre-type mismatch) | TIA-568.3-D Table 1 |
| 100G-DR/FR/LR (PAM4) ↔ CWDM4/LR4 (NRZ) | **FAIL**: "will not interoperate with legacy 100G modules" | Arista 100G Q&A |
| 25G NRZ ↔ 50G PAM4 lanes; 100G-lane ↔ 200G-lane | **FAIL** | Arista 800G FAQ; FiberMall |
| FEC mismatch (e.g. RS-FEC vs off on 25G-SR) | **FAIL or link degraded**: "use the same FEC mode on both ends" | Arista 100G Q&A; Cisco 25G white paper |

**Proposed engine fields:** `interopGroup` (e.g. `"mm850-25nrz"`, `"sm1310-100pam4"`, `"mm-bidi-sr1.2"`), `laneRateGbps`, `modulation` (`NRZ|PAM4`), `wavelengthScheme` (`single|bidi2|swdm4|cwdm4`), `fibreType` (`MMF|SMF`), `connector` (`MPO-12|MPO-16|LC`), `fecRequired` (`none|CL74|CL91|CL108|KP4`), `breakoutModes` (e.g. `["4x25G"]`), `breakoutReachM`, `platformSpecific` (bool), `vendorMode` (e.g. Arista SRBD).

### 3-4 Revision 3 unit-test channels

| ID | Channel | Expected |
|---|---|---|
| BO-01 | SR4 → Type B trunk → U1 (Type A adapter) → A-to-B → SFP-SR | FAIL (Tx→Tx) |
| BO-02 | Same as BO-01 with A-to-A | PASS + WARN (non-standard cord) |
| BO-03 | SR4 → Type B trunk → U2 (Type B adapter) → A-to-B | FAIL (Tx→Tx) |
| BO-04 | Same as BO-03 with A-to-A | PASS + WARN |
| BO-05 | SR4 → Type A trunk → U1 → A-to-B | PASS + WARN (mixed method) |
| BO-06 | SR4 → Type A trunk → U2 → A-to-B | PASS + WARN (mixed method) |
| BO-07 | SR4 → Type A trunk → U1/U2 → A-to-A | FAIL |
| BO-08 | SR4 → any trunk → straight cassette (Type A or B adapter) → any cord | FAIL (lane split) |
| BO-09 | All PASS cases: lane k ↔ port k; ports 5–6 dark | assert mapping |
| MB-01 | Type B trunk, identical upright straight cassettes (Type B adapters), A-to-B | WARN (port p → 7−p) |
| MB-02 | Same with far cassette inverted | PASS |
| MB-03 | B1 + B2 (11,12,9,10…) | PASS, p → p |
| MB-04 | B1 + plain reversal (12…1), A-B front adapters | FAIL (Tx→Tx) |
| MB-05 | B1 + plain reversal, B-A front adapters | PASS |
| MB-06 | B1 + B2 over Type A trunk | FAIL (port 7−p, even inversions) |
| IO-01 | 40G-SR4 → 4×10G-SR, breakout on | PASS (≤100 m OM3 / 150 m OM4) |
| IO-02 | 40G-SR4-S variant → breakout | FAIL |
| IO-03 | 100G-SR4 → 4×25G-SR with RS-FEC both ends | PASS |
| IO-04 | 100G-SR4 → 25G-SR with FEC mismatched | FAIL |
| IO-05 | 100G-SR4 → 4×10G-SR | FAIL |
| IO-06 | 400G-DR4 → 100G-DR/FR1/LR1 | PASS (≤500 m) |
| IO-07 | 400G-DR4 → 100G-CWDM4/FR4/PSM4 | FAIL |
| IO-08 | 400G-SR4.2 → 100G-SR1.2 | PASS |
| IO-09 | 400G-SR4.2 → 40/100-SRBD | FAIL (WARN vendorMode on Arista) |
| IO-10 | 400G-SR4.2 ↔ 400G-SR4 (802.3db) | FAIL |
| IO-11 | 400G-SR8 → 8×50G-SR / 2×200G-SR4 | PASS + WARN (MPO-16 out of v1) |
| IO-12 | 400G-SR4 (db) → 4×100G-SR1 | PASS |
| IO-13 | 800G 2×DR4 → 8×100G-DR/FR or 2×400G-DR4 | PASS |
| IO-14 | 800G 200G-lane DR4 → 100G-DR | FAIL |
| IO-15 | 100G-PSM4 → 4×25G-LR | WARN (platform-specific PASS) |
| IO-16 | MM optic on SMF; SR ↔ SWDM4; NRZ ↔ PAM4 | FAIL |

### 3-5 Revision 3 open items for engineering review
- **R3-O1.** Bench-verify BO-01/BO-02 with a live SR4 and a light meter. The U2 correction rests on derived algebra.
- **R3-O2.** Obtain licensed TIA-568.3-E Tables 13/14 and Figures 18/19 to confirm the A/B assignment of U1/U2 transitions. Senko's text extraction of the U2 figure looks garbled.
- **R3-O3.** Find a non-competitor numeric B2 map, and the front-adapter orientation of the "BN" drawing.
- **R3-O4.** Retrieve the INF-8074i / SFF-8432 SFP optical-interface figure.
- **R3-O5.** Decide whether v1 models MPO-16 (SR8) and dual-MPO 800G optics.
- **R3-O6.** Confirm IEEE clause numbers not taken from a source (802.3cm, 802.3db, 802.3df) against the current IEEE 802.3 edition.
- **R3-O7.** Decide how the Arista SRBD vendor mode, and the EdgeOptic statement that conflicts with it, should appear in the UI.
- **R3-O8 (repo).** Reconcile R3-2 (receptacle i ↔ plug 13−i) with harness tables that read as "plug position 1 = Tx" (Juniper, §5.4). Verdicts are unaffected; which fibre colour is drawn as Tx is affected.

### 3-6 Revision 3 caveats
- TIA-568.3-D was read from a copy on a document-sharing site and TIA-568-B.3 from a university-hosted copy. Use licensed copies for final citation.
- Competitor documents (FS.com, Leviton, CommScope, Siemon, Panduit-sourced) were used only for cross-checks. The B2 numeric map depends on one of them.
- Third-party optic vendor pages (QSFPTEK, FiberMall, EdgeOptic, AscentOptics, LINK-PP) are marketing material, used only for corroboration.

## Scope for Polarity Trace v1 (owner decisions, 2026-10-16)

These decisions limit what the tool shows. They don't change the research.

- **One MPO cable per link.** v1 has no two-trunk chains, MPO equipment cords between an optic and a trunk, harnesses or MPO-to-LC cables. The layout is: [duplex cord + duplex optics]? → End A (cassette or MPO optic) → one MPO cable → End B (cassette or MPO optic) → [duplex cord + duplex optics]?
- **Cassettes have exactly one rear MPO** and duplex LC ports on the front. Two-MPO cassettes, conversion trunks and conversion cassettes (§9) are out of scope for now. Multiple MPOs are planned for a later version.
- **SN and MDC** are out of scope (noted for later). **CS** behaves like LC.
- **Gender default:** cassette rear MPO is male (pinned), the MPO cable is female, and transceivers are male. A gender mismatch is shown as a note and never changes the light-path verdict. It is kept in the data for a future "parts request" output.
- **Polish default:** APC on singlemode MPO, UPC on multimode MPO, with the per-optic exceptions in §6.0.
- **Adapters are fixed.** Key-changeable MPO adapters and connectors exist but are not modelled.
- Rows in §8 that need components outside this scope (array cords, harnesses, two trunks) remain as engine tests but are not offered in the v1 UI.

---

## 1. Introduction and legend

**Purpose.** This file is the single source of truth for the polarity engine and its unit tests. Every mapping carries a status:

| Status | Meaning |
|---|---|
| **VERIFIED** | ≥3 independent sources agree, at least one of them a standards body, MSA or non-competitor. |
| **PARTIAL** | 2 sources, or ≥3 where all detailed ones are competitors, or the mapping is derived from verified rules rather than published. |
| **UNVERIFIED** | 0–1 source. Do not ship as a unit test until engineering confirms. |

**Position convention (applies everywhere unless stated).**
- View the MPO with the **key up** and look at the end face (or into an MDI receptacle with the keyway on top).
- Position 1 is at the far left and position 12 at the far right.\[6\]
- For 2-row MPO-24, the top row (the row nearest the key) is 1–12 and the bottom row is 13–24 (Senko; US Conec via TR-42 material).\[6\]\[7\]
- IEEE and the QSFP-DD MSA define transceiver lane positions "when looking into the MDI receptacle with the connector keyway feature on top."\[8\]
- **Revision 3:** plug positions are read on the plug end face, receptacle positions looking into the receptacle. Because the two faces meet face to face, a plug in an optic MPO receptacle maps **receptacle i ↔ plug 13−i**. Duplex A/B follow the key or latch: receptacle viewed latch-up = B left, A right; plug end face latch-up = A left, B right; equipment Tx = B, Rx = A. See §3-1.

**Terms.**

| Term | Definition |
|---|---|
| Tx / Rx | Transmit / receive fibre or lane. |
| Key-up → key-down | Connectors at the two ends of a cable (or the two sides of an adapter) face opposite key orientations. Through a **Type A adapter** this preserves position (1→1). |
| Key-up → key-up | Both keys face the same way. Through a **Type B adapter** this reverses position (1→12). |
| Trunk / array cable | MPO-to-MPO backbone cable (Type A, B or C). |
| Array patch cord | MPO-to-MPO equipment cord (Type A, B or C). |
| Fibre transition | The internal map inside an MPO-to-duplex cassette or harness: Type A (straight), Type U1 or Type U2. |
| A-to-B duplex cord | The TIA-standard duplex cord. The fibre in position A at one end arrives at position B at the other. FOA calls this the always-crossover duplex cord. Fluke and some vendors call it "straight-through" because the cord looks straight when laid flat. **Same physical cord, two names.** The tool should label it "A-to-B (standard)". |
| A-to-A duplex cord | Non-standard cord. Position A arrives at position A. Required at one end of Method A. |
| Male / pinned | MPO with guide pins. |
| Female / unpinned | MPO with guide holes. |
| Base-8 / 12 / 16 / 24 | Cabling built in groups of 8, 12, 16 or 24 fibres. |
| VSFF | Very-small-form-factor duplex connectors: CS, SN (Senko) and MDC (US Conec). |

**Source tiers used** (named inline in each section; the citation pass attaches URLs):
- **Standards and MSA:** TIA (via the TIA Fiber Optics Tech Consortium, FOTC), IEEE 802.3 task-force documents, QSFP-DD MSA, SFP-DD MSA, QSFP MSA, PSM4 MSA, 400G BiDi MSA.
- **Non-competitor industry:** Fluke Networks, VIAVI, EXFO, the Fiber Optic Association (FOA), US Conec, Senko, Cisco, Arista, NVIDIA, Juniper, plus optic and cable vendors not on the competitor list (Smartoptics, Prysmian, Sylex, ModuleTek, EDGE Optic, Metro Sales Solutions, LANshack).
- **Competitor (cross-check only, labelled):** Panduit, FS.com, Siemon, Corning, CommScope, Belden (including the "Precision OT" site, reclassified in revision 2).

### 1.1 Naming: connector footprint vs lit fibre count
**Status:** VERIFIED that no standard defines a combined label (QSFP-DD MSA Rev 7.0 §5.2.1; Fluke Networks "Are you ready for 400G Ethernet?"; TIA FOTC tables). PARTIAL on the IEC part number for the 1×16 connector.

- Standards name the **connector** (TIA FOCIS, IEC 61754-7-x) and the **application** (IEEE PMD, by fibre or lane count) separately.
- QSFP-DD MSA mapping:
  - "MPO-12 one row" = TIA-604-5 (FOCIS-5) / IEC 61754-7-1. In TIA usage, plain "MPO" means this connector.
  - "One row MPO-16" = TIA-604-18 (FOCIS-18) / IEC 61754-7-3. The MSA reference list and body text disagree on 7-3, and one secondary guide says a 1×16 part (7-4) is still under development. FOCIS-18 is the unambiguous reference.
  - "MPO-24 two row" = TIA-604-5 "MPO Two Row" / MSA "MPO-12 Two Row" / IEC 61754-7-2.
- **"MPO-8" is not a connector standard.** It is shorthand for 8 lit fibres in a 12-position body (EDGE Optic, "MTP MPO cables – All Basics You need to know").

**Tool rule:** label as **`MPO-<positions> · <lit>F`**: MPO-12 · 8F, MPO-12 · 12F, MPO-16 · 16F, MPO-24 · 16F, MPO-24 · 24F. Never show a bare "MPO-8". The tooltip gives the standard name. The data model stores `positions` and `litPositions[]` as separate fields and never derives one from the other.

---

## 2. MPO trunk / array-cable types (TIA-568.3-E)

### 2.1 Type A, 12F — straight-through
**Tooltip:** "Type A: key-up to key-down; fibre 1 arrives at position 1."
**Status:** VERIFIED. Sources: Fluke Networks; FOA; VIAVI; TIA FOTC (Method A uses Type-A straight-through trunks); Senko.\[2\]\[5\]

| End-1 pos | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| End-2 pos | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

Engine function: `f(i) = i`.

### 2.2 Type B, 12F — reversed
**Tooltip:** "Type B: key-up to key-up; fibre 1 arrives at position 12."
**Status:** VERIFIED. Sources: Fluke ("the fiber located in Position 1 arrives at Position 12 at the opposite end, the fiber located in Position 2 arrives at Position 11"); FOA; VIAVI; TIA FOTC ("Type-B (reverse sequence)").\[2\]\[9\]

| End-1 pos | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| End-2 pos | 12 | 11 | 10 | 9 | 8 | 7 | 6 | 5 | 4 | 3 | 2 | 1 |

Engine function: `f(i) = 13 − i`.

**APC caution:** key-up to key-up mating is not suitable for angled (APC) MPO end faces (Fluke; FOA notes the APC-angle mismatch was raised at TR-42.11).\[10\] Single-mode MPOs are all APC, and multimode APC is becoming common at 400G/800G.\[11\]\[12\] The tool should flag Type-B *adapters* on APC links. **Revision 2: this is now a BLOCK; see §3.1.** A Type B *cable* in APC is fine, because the reversal is built into the cable.

### 2.3 Type C, 12F — pair-flipped
**Tooltip:** "Type C: key-up to key-down with each adjacent pair swapped (1↔2, 3↔4 …)."
**Status:** VERIFIED. Sources: Fluke ("the fiber in Position 1 (Tx) arrives at Position 2 (Rx) at the opposite end, and the fiber in Position 2 (Rx) arrives at Position 1 (Tx)"); FOA; VIAVI; TIA FOTC ("Type-C (pair-wise flipped)").\[2\]\[12\]

| End-1 pos | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| End-2 pos | 2 | 1 | 4 | 3 | 6 | 5 | 8 | 7 | 10 | 9 | 12 | 11 |

Engine function: `f(i) = i + 1 if i odd, i − 1 if i even`.

**Caveat:** Type C does not readily support parallel 8-fibre optics. Those transmit on 1–4 and receive on 9–12, so a pair flip sends Tx→Tx (Fluke). Industry standards do not recommend Type C for that reason.\[12\]

### 2.4 Base-8 (8F in a 12-position MPO)
**Tooltip:** "Base-8: same MPO footprint, centre four positions (5–8) empty."
**Status:** VERIFIED. Sources: Fluke ("the same form factor as the Base-12 MPO, but with the four center fibers removed"; parallel apps transmit on 1–4 and receive on 9–12); FOA 40GBASE-SR4 pin table; IEEE 802.3 (200GBASE-SR4 / 400GBASE-SR4.2 text: "The four center positions are unused"); QSFP-DD MSA.\[12\]\[13\]

- **Lit positions:** 1, 2, 3, 4, 9, 10, 11, 12. Positions 5–8 are empty or dark.
- Type A, B and C maps are the 12F maps restricted to the lit positions:
  - Type A: 1–4→1–4 and 9–12→9–12.
  - Type B: 1→12, 2→11, 3→10, 4→9 (and the reverse).\[10\]
  - Type C: 1↔2, 3↔4, 9↔10, 11↔12.
- Type B maps lit positions onto lit positions, so Base-8 and Base-12 Type B cords are interchangeable for 8-fibre optics.

### 2.5 MPO-16 (1×16, single row) Type A / Type B
**Tooltip:** "MPO-16: 16 fibres in one row, offset key — will not mate with MPO-12/MPO-8."\[4\]\[14\]
**Status:** PARTIAL (derived). No non-competitor publishes the table. The only explicit statement found is in AMPCOM's Tech Lab blog post "MPO/MTP Polarization Types Explained": "MPO-16 Type B equivalent: Lane 1 → Lane 16, Lane 2 → Lane 15, ...". The maps below come from the verified 12F definitions applied to 16 positions. US Conec sells both aligned-key and opposed-key MTP-16 adapters, so both orientations exist physically.

| Type | Map | Engine function\[10\] |
|---|---|---|
| A (key-up→key-down) | 1→1 … 16→16 | `f(i) = i` |
| B (key-up→key-up) | 1→16, 2→15, … 8→9, 9→8, … 16→1 | `f(i) = 17 − i` |
| C | Not used for MPO-16 parallel optics; do not offer. No source for an MPO-16 Type C was found. | — |

**Revision 2:** still PARTIAL (derived), but now consistent with the QSFP-DD MSA MPO-16 MDI figure: Tx 1–8 occupy positions 1–8 and Rx 8…1 occupy positions 9–16, so lane *k* Tx = position *k* and Rx = position 17−*k*. A direct transceiver-to-transceiver cord therefore needs `f(i) = 17 − i`. It is unverified whether opposed-key and aligned-key MPO-16 adapters are both commonly sold. MPO-16 SR8 optics are APC, so the §3 APC block applies to aligned-key MPO-16 adapters by default.

**Consistency check:** SR8/DR8 put Tx on 1–8 and Rx on 9–16 (see §6). With the Type B map, Tx position 1 lands on position 16 (Rx), so a Type B MPO-16 cord passes between two SR8 optics. This agrees with how IEEE and US Conec describe 16-fibre parallel links (8 Tx / 8 Rx).\[15\]

### 2.6 MPO-24 (2×12) Type A / B / C — row swapping
**Tooltip:** "MPO-24: two rows of 12; flipping the connector also swaps the rows."
**Status (revision 2):** Type A (1→13) **VERIFIED**. Type B (1→24) PARTIAL. Type C (1→14) PARTIAL.
- **Revision 2 sources for Type A = 1→13:**
  - Sylex (non-competitor assembly maker), "Is the 24 fibre connectivity method really clear?", citing TIA-568.3-D: "Tx0 – position No.13 on the near end is connected to Rx0 – position No.1 on the far end, using a Type A:2-2 patch cord". Sylex notes that a 1→1 24F cord ("Type X") is not covered by TIA-568.3-D. That is exactly the sales-team misconception.
  - IEEE P802.3cm task-force contribution "400GBASE-SR8 MDI Choices" (May 2018): for 2-row applications the TIA methods "deliver lateral and row transposition (Tx to Rx)".
  - IEEE 802.3 NGMMF reflector thread: "the automatic flip which occurs with a 24 fiber ribbon".
  - Competitor (Belden-branded, formerly listed as non-competitor "Precision OT"): "Position 1 will mate up to Position 13".
  - Competitor white paper reproducing TIA-568.3-D (FS.com): full tables below.
- **Disagreement:** Senko's polarity guide puts "Position 1 … mated with … Position 13" under **Type B**. That conflicts with every other source and with Senko's own 12F text. It is probably a text error; treat it as non-authoritative.
- Fluke and VIAVI public pages give 12F maps only.

Revision 1 notes:
- The only full published table is a competitor's (FS.com white paper, citing TIA-568.3-D: "Type A Key-up to Key-Down P1 to P13 … Type B Key-up to Key-up P1 to P24 … Type C Key-up to Key-Down P1 to P14").\[3\]
- Corroborated in part by Precision Optical Transceivers (competitor, Belden-branded; see C-3) ("Position 1 will mate up to Position 13" for 24F through a Type A adapter) and by a vendor blog (Type B "Lane 1 → Lane 24 … Lane 12 → Lane 13").\[14\]\[16\]
- An IEEE 802.3cm task-force contribution (May 2018) confirms that "dual-row array polarity transposes signals horizontally and vertically."\[8\]\[17\]
- The maps also follow geometrically: key-up→key-down mirrors the array top-to-bottom, and key-up→key-up rotates it 180°.

| Type | End-1 1–12 → End-2 | End-1 13–24 → End-2 | Rule |
|---|---|---|---|
| A (key-up→key-down) | 13, 14, … 24 | 1, 2, … 12 | Rows swap, left-right order kept: `f(i) = i ± 12` |
| B (key-up→key-up) | 24, 23, … 13 | 12, 11, … 1 | Rows swap and each row reverses: `f(i) = 25 − i` |
| C (key-up→key-down) | 14,13,16,15,18,17,20,19,22,21,24,23 | 2,1,4,3,6,5,8,7,10,9,12,11 | Rows swap and adjacent pairs flip |

**Tool rule:** show "rows swap in 24F Type A" as an inline hint on every 24F Type A trunk.

**Open item:** confirm Type B and Type C against the TIA-568.3-E two-row annex or TSB-5069. Some vendors label 24F assemblies by *their* Type A/B behaviour, so a "Type A" 24F from one vendor may not match this table.

### 2.7 MPO-32 (2×16)
**Status:** UNVERIFIED for cable maps. MPO-32 has the same offset key as MPO-16 (EXFO; Fluke: "16- and 32-fiber MPO connectors have the key offset to the left").\[18\] By analogy with §2.6 the rows would swap (`Type B: f(i) = 33 − i`), but no source publishes it. Recommendation: show MPO-32 in the tool only as a connector, not as a polarity-tested trunk, until engineering supplies a drawing.

---

## 3. Mating adapters

| Adapter | Map | Status | Sources |
|---|---|---|---|
| Type A (key-up→key-down; "opposed key") | `f(i) = i` (pin 1 meets pin 1; colour codes maintained) | VERIFIED | FOA ("pin 1 of one connector is aligned with pin 1 of the other connector"), TIA FOTC, Fluke, US Conec (opposed-key adapters)\[3\]\[11\]\[19\] |
| Type B (key-up→key-up; "aligned key") | `f(i) = (N+1) − i` for a single row of N positions | VERIFIED for 12F; PARTIAL for 16F | FOA ("swap the color codes of the fibers, similar to what happens in a Type B cable"), TIA FOTC, Fluke\[3\]\[11\] |

**Engine rule (from FOA):** "adding Type B components (cables or mating adapters) swaps the fibers while Type A components … does not". An odd number of Type B components reverses the array; an even number restores it.\[10\]

**Plain-language note:** an adapter is the coupler two MPO connectors plug into. In a key-up/key-down adapter the two connectors face opposite ways; in a key-up/key-up adapter they face the same way. In practice the adapter is usually built into the back of the cassette (for example, U1 cassettes have key-up/key-down, Method B cassettes have key-up/key-up), so the cassette choice decides it.

### 3.1 APC and key-up/key-up (revision 2)
**Status:** VERIFIED (≥5 sources, 4 non-competitor).
- EXFO, "MPO connector basics and best practices" (Cabling Installation & Maintenance): "Type B adapters apply only to multimode flat connectors, as it would be physically impossible to mate two APC connectors key-up to key-up; they can only mate key-up to key-down to match their angles". The APC "peak" is on the key side.
- Fluke Networks: Method B's key-up to key-up approach "is not suitable for MPO connectors that feature angled physical contact (APC) end faces".
- ModuleTek application note: APC interconnection "must use Key Up/Key Down adapters".
- Senko TIA-polarity note: MPO polarity configurations "are applicable to MM MPOs with a flat polish"; mating MPO/APC through the Method B adapter "can be challenging".
- Competitor (Belden-branded): "Type A adapters MUST be used with Angle Polished Connectors."

**How Type B APC cords and trunks are built:** the reversal happens **inside the cable** (fibre 1 terminated in position 12, per FOA). Both ends are key-up plugs, and the cable is mated only through key-up/key-down adapters or into transceiver receptacles.

**If two APC ferrules are mated key-up/key-up**, the 8° faces don't match. The result is gross insertion loss or no physical contact. FOA notes that some TIA options allow mismatched angle orientations (raised at TR-42.11), and that only about the central third of an APC MPO ferrule actually mates.

**Are key-up/key-up APC adapters sold?** No standalone one was found. One connector maker sells key-changeable connectors and adapters; there the real constraint is angle orientation, not the adapter label. Key-changeable parts are out of scope.

**Buildable in APC:**

| Preset | Adapter | Buildable in APC? |
|---|---|---|
| Method A (duplex, cassette) | Type A | Yes |
| Method B (duplex cassette, Type B rear adapter) | Type B | **No** |
| Method C | Type A | Yes |
| U1 | Type A | Yes |
| U2 | Type B | **No** |
| Parallel Method B (Type B cords, Type B adapters) | Type B | **No** |
| Parallel Method A (Type A trunk, Type A adapters, one Type A + one Type B cord) | Type A | Yes |
| Direct Type B cord, transceiver to transceiver | none | Yes |

**Tool rules:**
- **BLOCK** any key-up/key-up adapter when either mating connector is APC, with the message "APC angles cannot mate key-up/key-up". Grey out the Method B and U2 presets when polish = APC.
- **BLOCK** mating APC to UPC. FOA: MM APC is "only supposed to be mated to another APC connector".
- On UPC links, a key-up/key-up adapter is normal; show at most an informational note.

---

## 4. Cassettes / fibre transitions (MPO → duplex LC)

LC numbering: LC fibre 1–12 occupies duplex ports 1–6, with port *p* = LC fibres (2p−1, 2p).

### 4.1 Type A transition ("standard" cassette, Methods A and C)
**Tooltip:** "Standard cassette: MPO position n goes to LC fibre n."
**Status:** VERIFIED. Sources: TIA FOTC ("Type-A transitions"), Fluke ("cassettes with Type A fiber transition and Type A adapters"), Panduit drawing (competitor: Method A "MPO 1 2 3 … 12 → LC 1 2 3 … 12").\[2\]\[12\]

| MPO pos | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| LC fibre | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

- **Method A / C:** Type A rear MPO adapter.
- **Method B:** the same Type A transition but with a **Type B (key-up→key-up) rear adapter**. Fluke notes that Method B "typically requires inverting one of the cassettes" or "two different cassettes" at either end.\[12\]
- Panduit's "Method B BN" cassette is drawn as MPO 12, 11 … 1 → LC 1 … 12 with a key-up/up adapter (competitor source).\[20\] **Revision 3:** as a far-end cassette, this plain reversal FAILS with A-B front adapters and PASSES only with B-A front adapters. The pair-preserving B2 map is 11,12,9,10,7,8,5,6,3,4,1,2 (§3-2).
- The tool should model Method B as either (a) one standard and one inverted cassette, or (b) "B-end-1 / B-end-2" cassette pairs. Both give the same result.

**Method B in practice (revision 2).** **Status:** VERIFIED. The market sells both approaches:
- Fluke Networks: Method B "typically requires inverting one of the cassettes. This can make connection numbering confusing and require special labeling. Some manufacturers require two different cassettes for Method B at either end."
- Metro Sales Solutions (distributor), "Fiber Polarity in MPO/Cassette Systems": (1) "physically turn one cassette over, installing it 'upside down'", so the LC latches point down at one end; or (2) a matched "B1"/"B2" pair using "a 'true' B2 cassette where the port position changes are done within one of the cassettes".
- LANshack cassette tutorial: "one cassette in the key up position … one … in the key down position".
- A competitor catalogue sells a dedicated "Method B – Far End" cassette.

**Port arithmetic (derived).** Type B trunk (i→13−i), Type B adapters, straight transitions, both cassettes upright. Near port *p* (MPO 2p−1, 2p) lands on far MPO 14−2p, 13−2p, which is **far port 7−p**, with A↔B crossed, so Tx→Rx holds.
- **Far cassette inverted:** its printed port 7−p sits physically at panel position *p*. Panel position *p* → *p*, but the printed label reads 7−p.
- **Matched B2 cassette:** the internal re-ordering gives printed port *p* → port *p*.
- **Not buildable in APC** (§3.1).

### 4.2 "Pair-flipped" Type A cassette (Panduit "AF", "Modified Method A")
**Status:** PARTIAL. Competitor-only (Panduit: MPO 2 1 4 3 6 5 8 7 10 9 12 11 → LC 1–12; FS lists "AF").\[3\]\[20\] It is not a TIA-named transition. Functionally it equals a Type A cassette followed by a Type C flip, so it lets Method A run with A-to-B cords at both ends. Recommend modelling it as a vendor variant only.

### 4.3 Universal cassette = TIA Type-U1 transition (Panduit "Universal")
**Tooltip:** "Universal cassette: pairs outer fibres (1+12, 2+11 …) into each LC port so the same cassette and A-to-B cords work at both ends of a Type-B trunk."
**Status:** VERIFIED. Sources:
- Fluke: U1 "where the fiber in Position 12 transitions to Position 2, the fiber in Position 11 transitions to Position 4, and so on".\[12\]
- FOA: "Type U … pair fibers 1-12, 2-11, 3-10, 4-9, 5-8, 6-7 in version U1".\[10\]
- TIA FOTC: U1 = Type-B trunk + Type-U1 transitions + Type-A adapters + A-to-B cords both ends.\[2\] Senko's non-competitor application note "Fiber Optic Polarity Guide for VSFF Connectivity" (Oct 2023), Table 1, lists the same component set: "U1 Type-B:1-1 Type-A Type-U1 A-to-B; U2 Type-B:1-1 Type-B Type-U2 A-to-B".
- Panduit drawing (competitor): "UNIVERSAL 12F – CASSETTE (U) … MPO 1 12 2 11 3 10 4 9 5 8 6 7 → LC 1 … 12".\[20\]
- Siemon and FS (competitors) describe the same method.\[1\]\[21\]

| LC fibre (port) | 1 (P1) | 2 (P1) | 3 (P2) | 4 (P2) | 5 (P3) | 6 (P3) | 7 (P4) | 8 (P4) | 9 (P5) | 10 (P5) | 11 (P6) | 12 (P6) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MPO pos | 1 | 12 | 2 | 11 | 3 | 10 | 4 | 9 | 5 | 8 | 6 | 7 |

- **Your proposed map is confirmed exactly:** 1→LC1, 12→LC2, 2→LC3, 11→LC4, 3→LC5, 10→LC6, 4→LC7, 9→LC8, 5→LC9, 8→LC10, 6→LC11, 7→LC12.
- **Required with:** a Type-B trunk, a Type-A (key-up→key-down) rear adapter, and A-to-B duplex cords at both ends (TIA FOTC; Fluke; Panduit: "Key Up/Key Down Adapter … Requires Method B MPO Connectivity").\[2\]\[12\]\[22\]
- **Why it works:** the Type-B trunk sends MPO 1→12 and 12→1. So LC1 (MPO 1) arrives at far-end LC2 (MPO 12), and LC2 arrives at far-end LC1. Every port lands on the **same port number** with its pair inverted once. The two A-to-B cords add two more inversions, giving three in total (odd) → Tx→Rx.
- **Breakout limitation:** used for direct breakout (parallel optic → duplex optics), U1 requires non-standard A-to-A cords (Fluke).\[12\] **Revision 3:** in the v1 layout (optic → Type B trunk → cassette), U2 needs A-to-A cords too. U1 and U2 behave the same there (§3-1).
- **Variants:**
  - 8F / 4-port, from the Panduit U 16F listing (competitor): "1 12 2 11 3 10 4 9" across LC 1–8.
  - 16F / 8-port, a pair of 8F transitions: Panduit "U" = 1 12 2 11 3 10 4 9 on each MPO-12 (PARTIAL, competitor-only). **Two rear MPOs, so out of v1 scope.** For single-MPO versions see §4.3a.
  - 24F / 12-port: two 12F U1 transitions (Panduit 2×MPO-12 universal parts exist). Map is PARTIAL, competitor-only. **Two rear MPOs, so out of v1 scope.** For single-MPO versions see §4.3a.
- **Corning "Universal Wiring":** Fluke's MultiFiber Pro detects "A, B, C, and Corning Plug & Play™ Universal Systems polarities", which confirms that a Corning universal scheme exists and is distinct.\[23\]\[24\] Its internal map was not verified here (competitor).

### 4.3a Single-MPO universal cassettes beyond 12F (revision 2, DERIVED)
**Status:** UNVERIFIED as products. The maps are derived and checked algebraically. No non-competitor publishes single-MPO universal maps at 16F or 24F. Senko's "Fiber Optic Polarity Guide for VSFF Connectivity" (Oct 2023, Rev. 01) says only that "the same U-type transition can be used at each end regardless of whether the cables are MPO-8, MPO-12, or MPO-16".

**Derivation rule.** In 12F U1, LC port *p* has fibre A = MPO *p* and fibre B = MPO 13−p. A Type B trunk maps i → N+1−i. Through a Type A rear adapter at both ends, near port *p* fibre A (MPO *p*) arrives at far MPO N+1−p, which is fibre B of far port *p*. Result: port *p* → port *p* with one A↔B cross. Generalised: **port p = (MPO p, MPO N+1−p)**.

**(a) U1-16: MPO-16 → 8 LC ports.** LC fibre order 1,16,2,15,3,14,4,13,5,12,6,11,7,10,8,9.

| LC port | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Fibre A (MPO) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| Fibre B (MPO) | 16 | 15 | 14 | 13 | 12 | 11 | 10 | 9 |

With an MPO-16 Type B trunk (f(i)=17−i, itself derived; §2.5) and Type A adapters: port *p* → port *p*, Tx→Rx.

**(b) U1-24: MPO-24 → 12 LC ports (cross-row pairing).**

| LC port | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Fibre A (MPO) | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
| Fibre B (MPO) | 24 | 23 | 22 | 21 | 20 | 19 | 18 | 17 | 16 | 15 | 14 | 13 |

- With a 24F Type B trunk (i → 25−i): A of port *p* → 25−p = B of port *p*. **PASS**, port *p* → *p*.
- With a 24F Type A trunk (i → i±12): A of port *p* → 12+p = B of port 13−p. **FAIL** (port *p* → 13−p).

**Rejected per-row pairing.** The pairing (1,12),(2,11)…(6,7) on row 1 and (13,24)…(18,19) on row 2 fails with a 24F Type B trunk. Tx→Rx survives but **port p → port p+6**. Never offer it as a universal preset; keep it only as a FAIL fixture.

**(c) U1-24·16F: MPO-24 · 16F → 8 LC ports.** Lit positions follow the 400G SR8 option-A footprint: 1–4, 9–12, 13–16, 21–24.

| LC port | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
|---|---|---|---|---|---|---|---|---|
| Fibre A (MPO) | 1 | 2 | 3 | 4 | 9 | 10 | 11 | 12 |
| Fibre B (MPO) | 24 | 23 | 22 | 21 | 16 | 15 | 14 | 13 |

The set is closed under i → 25−i, so with a 24F Type B trunk port *p* → *p* and Tx→Rx hold. In direct breakout, each LC port carries exactly one SR8 option-A Tx lane and one Rx lane.

**Tool rule:** ship U1-16, U1-24 and U1-24·16F with a visible **"derived, not a published TIA transition"** badge (`verified: false`).

### 4.4 TIA Type-U2 transition
**Tooltip (revised in revision 3):** "U2 cassette: like U1 but mirror-paired (12+1, 11+2 …) and used with key-up/key-up adapters. Through a trunk it behaves exactly like U1; its breakout advantage applies only when its MPO plugs straight into the optic."
**Status:** VERIFIED (method) / PARTIAL (exact order).
- Method sources: TIA FOTC (Type-B trunk + Type-U2 transitions + Type-B adapters + A-to-B cords); Fluke (fibre "in Position 12 transitions to Position 1, the fiber in Position 11 transitions to Position 3"); FOA ("reverses that in version U2").\[2\]\[12\]
- Exact order source: Panduit "Method U2" listing (competitor): "12 1 11 2 10 3 9 4".\[22\]
- Note: Fluke's text says U2 uses "Type U1 fiber transition". This is a typo; TIA FOTC states Type-U2 transitions.\[2\]\[12\]

| LC fibre | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MPO pos | 12 | 1 | 11 | 2 | 10 | 3 | 9 | 4 | 8 | 5 | 7 | 6 |

**Revision 2: order confirmed.** **Status:** VERIFIED for the order (Fluke text, plus derivation, plus the competitor source for 1–8). Fluke's pattern gives LC fibre 2k−1 = MPO 13−k and LC fibre 2k = MPO k, so fibres 9–12 = MPO 8, 5, 7, 6. The end-to-end check is derived:
- U2 MPO position = 13 − U1 MPO position. U2 is exactly the U1 order seen through a key-up/key-up adapter.
- With a Type B trunk and Type B adapters at both ends, the net cassette-to-cassette map is 13−i. Port *p* → port *p* with one A↔B cross, so A-to-B cords at both ends give 3 inversions (odd) → Tx→Rx.
- **Not buildable in APC** (§3.1).

**Engineering flag (revision 2).** In this position algebra, "U1 transition + Type A adapter" and "U2 transition + Type B adapter" are externally identical. That contradicts Fluke's statement that U1 needs A-to-A cords for direct breakout while U2 does not. The cassette-rear frame convention must be checked against the TIA-568.3-E figures before the U1/U2 direct-breakout tests are frozen. **Resolved in revision 3 (§3-1):** the two really are identical through a trunk. Fluke's statement holds only for a direct transition whose MPO mates the optic. TIA figure confirmation is still open (R3-O2).

(Revision 1 note: positions 5–12 of this row were extrapolated from the 8-fibre published pattern.) Fluke states that U2 "also supports direct breakout applications where a high-speed parallel optic switch port connects to multiple lower-speed duplex ports, such as leveraging an 8-fiber 400 Gig switch port to connect four duplex 100 Gig servers".\[12\]

### 4.5 24F straight cassette: one MPO-24 in, 12 LC ports out (revision 2)
**Status:** PARTIAL. The straight map is generic and confirmed only through competitor catalogues ("24-fibre Type A", "AF" pair-flipped and "Method B – Far End" 24F cassettes). Far-end variant maps are not published by non-competitors.

- **Straight (Type A-style) transition:** MPO *i* → LC fibre *i*, so row 1 (1–12) → ports 1–6 and row 2 (13–24) → ports 7–12.
- **Three 8-fibre groups:** only seen as cassettes with three rear MPOs, so out of scope.
- **Universal 24F:** see §4.3a(b).

With straight cassettes at both ends, no trunk type gives port *p* → port *p*:

| Trunk | Near port 1 (MPO 1,2) arrives at | Result |
|---|---|---|
| 24F Type A (1→13) | MPO 13,14 = port 7 | Port *p* → *p*+6 (mod 12), A→A and B→B: no crossover in the trunk |
| 24F Type B (1→24) | MPO 24,23 = port 12, A↔B crossed | Port *p* → 13−p |
| 24F Type C (1→14) | MPO 14,13 = port 7, crossed | Port *p* → *p*+6 |

Straight 24F cassettes therefore need a matched far-end variant or the derived universal pairing.

**Tool rule:** offer "24F straight" as a cassette. The engine reports the actual far port and flags **WARN: port renumbering** whenever Tx→Rx passes but the far port differs from the near port.

---

## 5. Cords and harnesses

### 5.1 LC duplex cords
| Cord | Map (end-1 → end-2) | Tooltip | Status |
|---|---|---|---|
| A-to-B (TIA standard) | A→B, B→A | "Standard duplex cord: one built-in Tx/Rx cross." | VERIFIED (TIA FOTC; Fluke: TIA-568.3-E "recommends an A-B polarity scenario for duplex patch cords"; FOA: "Position A of one connector connects to Position B on the other end")\[12\]\[25\] |
| A-to-A | A→A, B→B | "Non-standard cord: no cross. Only for Method A (one end) or U1 breakout." | VERIFIED (TIA FOTC; Fluke: "Non-standard A-A duplex patch cords"; FOA)\[2\]\[12\] |

**Duplex-only TIA methods (no MPO):** consecutive-fibre positioning (adapters reversed at one end) and reverse-pair positioning (fibres 2,1,4,3 at one end) (TIA FOTC).\[2\]

### 5.2 CS, SN and MDC duplex cords
**Status:** PARTIAL.
- Specifications: CS is TIA-604-19 (FOCIS-19), SN is Senko SN-60092019 and MDC is US Conec USC-11383001 (all per the QSFP-DD MSA).
- **CS** works like LC. Senko's application note "Fiber Optic Polarity Guide for VSFF Connectivity" (Oct 2023, Rev. 01) lists CS as "ANSI/TIA-604-19 (FOCIS-19). Horizontal polarity scheme similar to LC". Use LC logic with the A-to-B standard cord.
- **SN and MDC** are different. The same Senko note says the A/B concept "applies to LC, SC, CS® and other horizontal duplex connectors with exception of vertical duplex connectors such as SN® or MDC®". It describes SN as using a "Vertical polarity scheme".
- The engine must not assume SN/MDC cords behave identically to LC. Model their A/B positions vertically, per the Senko and US Conec drawings.

### 5.3 MPO-to-MPO equipment (array) cords
Same maps as §2 (Type A / B / C), always **female both ends** when plugging into transceivers (see §7). The usual direct-connect cord between two parallel optics is **Type B**. Examples:
- NVIDIA: "Fiber cables are crossover cable Type-B that aligns the transmit laser with the opposite transceiver's" receiver.\[26\]
- FOA: Type B is "a cable you would use if you have a 40G parallel optics link and use a single cable to connect the transceivers."\[10\]

### 5.4 MPO-to-duplex harnesses / fan-outs
**Status:** PARTIAL. A harness behaves like a cassette whose transition is built into the cable; model it with the §4 transition tables. For SR4/DR4 breakout to 4× duplex, the conventional pairing is lane *n* Tx (pos *n*) with lane *n* Rx (pos 13−*n*): legs = (1,12), (2,11), (3,10), (4,9).\[10\] This follows from the IEEE/FOA lane tables, and it is the same pairing as U1. Whether leg *n*'s "A" connector is Tx or Rx varies by vendor. **Open item:** standardise our harness leg labelling.

**Revision 2.** **Status:** VERIFIED for the leg/position mapping; UNVERIFIED for any A/B or boot-colour convention.
- Leg L = MPO positions L and 13−L. Sources: Juniper cable specification table ("1 – Tx on LC Duplex 1 … 12 – Rx on LC Duplex 1", plus 2/11, 3/10, 4/9); FOA 40GBASE-SR4 table; QSFP-DD MSA lane figure (TX 1–4, RX 4–1).
- **Which LC ferrule is Tx is not standardised.** Optic vendors label legs "Tx/Rx on LC Duplex n" or by fibre colour (blue = pos 1, aqua = pos 12) rather than A/B. Fluke's explanation of the TIA duplex rule: "the Tx (B) should always connect to the Rx (A)".
- **Tool rule:** model legs as `{leg L: [MPO L, MPO 13−L]}`. Make the ferrule-to-fibre assignment a configurable property, defaulting to fibre colour. Evaluate Tx→Rx at the far optic using §6.6, not an A/B label. (Harnesses are out of v1 scope.)

---

## 6. Optics: connector, fibre, reach, lane positions

All MPO positions are looking into the module receptacle, keyway up. Unless noted, reaches are the IEEE/MSA nominal values. Reaches not specifically re-fetched in this research pass are marked (†) and should be spot-checked against the vendor datasheet you will display.

### 6.0 Polish defaults and exceptions (revision 2)
**Rule:** default **APC for singlemode MPO** and **UPC for multimode MPO**, overridden per optic.
**Sources:** Arista "400G Transceivers and Cables Q&A" ("all 40G and 100G parallel MMF optics (such as the QSFP-40G-SR4 and QSFP-100G-SR4) use MPO-12 PC/UPC … only MPO-12 APC connectors are used with OSFP-400G-VSR4 and QDD-400G-VSR4 modules"); FOA ("for very high speed MM networks, some transceivers require APC multimode connectors which are color coded green"); Fluke (MM APC MPO is "becoming the norm for high-speed 400 and 800 Gig applications").

**Multimode APC exceptions:**

| Optic | Connector | Polish | Status |
|---|---|---|---|
| 400GBASE-SR8 (QSFP-DD/OSFP) | MPO-16 | **APC** | VERIFIED (Arista "MPO-16 APC"; third-party listings; one blog claims UPC, OEM wins) |
| 400GBASE-SR4 / VR4 (802.3db) | MPO-12 | **APC** | PARTIAL (Arista; third-party OSFP-400G-SR4 "MPO-12 (APC)") |
| 800G SR8 / VR8 | MPO-16 | APC (expected) | UNVERIFIED per part |
| 800G 2×SR4 / 2×VR4 | 2× MPO-12 | APC (expected) | UNVERIFIED per part |
| 400G SR4.2 BiDi | MPO-12 | **UPC** | PARTIAL (Arista UPC; one third party says APC) |

- **Singlemode MPO shipping UPC:** none found (400G-DR4 is MPO-12 APC per Arista and third parties). UNVERIFIED that none exist.
- **Duplex LC:** UPC on both MM and SM optics.
- **Mixing APC and UPC on one mate:** BLOCK (§3.1).

### 6.1 Duplex LC (and BiDi)
| Optic | Std / clause | Fibre | Reach | Tx/Rx | Status |
|---|---|---|---|---|---|
| SFP+ 10GBASE-SR | IEEE Cl. 52 | MMF | 300 m OM3 / 400 m OM4 † | 1 Tx + 1 Rx, duplex LC | PARTIAL (duplex Tx-left convention per MSA figures; see open items) |
| SFP+ 10GBASE-LR | Cl. 52 | SMF | 10 km † | duplex LC | PARTIAL |
| SFP28 25GBASE-SR / -LR | Cl. 112 / 114 | MMF / SMF | 70 m OM3–100 m OM4 / 10 km † | duplex LC | PARTIAL |
| QSFP28 100GBASE-LR4 | Cl. 88 | SMF, 4λ WDM | 10 km † | duplex LC | PARTIAL |
| QSFP28 100G-CWDM4 | CWDM4 MSA | SMF, 4λ | 2 km † | duplex LC | PARTIAL |
| QSFP-DD 400G-FR4 / LR4 | 100G Lambda MSA / IEEE Cl. 151 † | SMF, 4λ | 2 km / 10 km (Cisco QDD-400G-LR4-S "10km Duplex SMF") | duplex LC | PARTIAL\[27\] |
| ~~100G SR1.2 / 400G BiDi (QDD-400G-BD)~~ | **Removed in revision 2 (C-1).** 400G BiDi is MPO-12; see §6.2. | | | | |
| QSFP-100G-SR1.2 (100G SR1.2 BiDi, 850/910 nm, 2×50G PAM4) | Vendor / MSA (not an IEEE 802.3 PMD per TIA FOTC list) | MMF, bidirectional | 70 / 100 / 150 m OM3/OM4/OM5 | Duplex LC UPC; each fibre carries Tx and Rx on different λ. **Canonical duplex-LC BiDi example.** Interoperates with QDD-400G-SR4.2-BD in 4×100G breakout | VERIFIED (Cisco 100G QSFP data sheet + ≥2 third parties) |
| QSFP-40/100-SRBD (100G mode / 40G mode) | Vendor (Cisco) | MMF, bidirectional | 100G: 70 / 100 m OM3/OM4; 40G: 100 / 150 m OM3/OM4 | Duplex LC. **Does not interoperate with SR1.2** | VERIFIED (Cisco data sheet) |

**Engine note:** with standard A-to-B cords, any duplex optic pair works over a channel with an odd inversion count. BiDi still needs the TR fibre to meet the far-end RT fibre, so the same polarity rules apply.

**Revision 2 reach corrections for duplex optics:** 10GBASE-SR 300 m OM3 / 400 m OM4 and 25GBASE-SR 70 m OM3 / 100 m OM4 are now verified (§6.7). Duplex LC optics are UPC on both MM and SM; no APC duplex-LC transceiver was found (UNVERIFIED).

### 6.2 MPO-12 parallel (Base-8 lane pattern)
**Lane rule (all rows below):** Tx occupies positions **1–4**, Rx occupies **9–12**, and 5–8 are unused.
**Status:** VERIFIED. Sources:
- FOA 40GBASE-SR4 table (Ch1 Tx 1/Rx 12, Ch2 2/11, Ch3 3/10, Ch4 4/9).\[10\]
- IEEE 802.3cd Clause 138 text ("The transmit optical lanes occupy the leftmost four positions. The receive optical lanes occupy the rightmost four positions").\[8\]\[28\]
- PSM4 MSA Fig. 8 (MPO-12 lane assignment).\[29\]
- Third-party DR4 datasheet (Comnen) quoting the same IEEE wording.\[30\]
- Fluke (Tx 1–4 / Rx 9–12).\[12\]

| Optic | Std / clause | Fibre / polish | Reach | Notes |
|---|---|---|---|---|
| 40GBASE-SR4 QSFP+ | Cl. 86 | MMF, MPO-12 UPC | 100 m OM3 / 150 m OM4 † | FOA lane table |
| 100GBASE-SR4 QSFP28 | Cl. 95 | MMF, MPO-12 | 70 m OM3 / 100 m OM4 † | |
| 100G PSM4 QSFP28 | PSM4 MSA | SMF, MPO-12 APC | 500 m (MSA "2-500 m"); Arista lists MPO-12 APC |\[29\]\[31\] |
| 200GBASE-SR4 | Cl. 138 | MMF, MPO-12 | 100 m OM4 † | IEEE 802.3cd text above |
| 400GBASE-DR4 QSFP-DD/OSFP | Cl. 124 (802.3bs) | SMF, MPO-12 **APC** | 500 m; DR4-2 (802.3df) 2 km | Arista: "MPO-12 APC SMF connector"; breaks out to 4×100G-DR/FR/LR (Cisco)\[27\]\[32\]\[33\] |
| 400GBASE-SR4 / VR4 | Cl. 167 (802.3db) | MMF, MPO-12 APC | 100 m / 50 m OM4 | Cisco QDD-400G-VR4 "MPO12 APC MMF 50m"\[32\]\[34\] |
| 400GBASE-SR4.2 (BiDi), QDD-400G-SR4.2-BD | Cl. 150 (802.3cm) | MMF, MPO-12 | 70 / 100 / 150 m OM3/OM4/OM5 (Cisco: MPO-12 **UPC**) | Positions 1–4 = **TR**, 9–12 = **RT**; "TR lanes connect to RT lanes" (IEEE 802.3cm task-force contribution, Sept 2018). Breaks out to 4× QSFP-100G-SR1.2 (Cisco).\[34\]\[35\] |

**Source conflict:** for SR4.2, Cisco specifies MPO-12 UPC while some third-party clones list APC.\[34\]\[36\] Cisco (the OEM) is authoritative for its own part. The tool should key polish to the selected part number.

**Revision 2, SR4.2 connector (VERIFIED):** Cisco's "Fiber Optic Transceiver Breakout Cable Ordering Guide: Cisco Nexus" states QDD-400G-SR4.2-BD links are "accomplished using pairs 1-4 and 9-12 of a MPO-12 connector, which can be broken out to Duplex LC". Arista's 400G optics FAQ lists QDD-/OSFP-400G-SRBD as parallel MMF with "MPO-12 Un-angled Connector (UPC)". The engine treats SR4.2 lanes as **TR/RT pairs**: per QSFP-DD MSA Table 15, position *k* (TRk) must land on position 13−k (RTk) at the far module. In effect this is the same Type B rule as SR4.

**Revision 2 reach corrections:** 100GBASE-SR4 is **70 m OM3 / 100 m OM4** (IEEE Cl. 95); the TIA FOTC table's 100/150 m conflicts with IEEE (C-4). 400GBASE-SR4 (802.3db) is 60 m OM3 / 100 m OM4, and VR4 is 30 / 50 m. See §6.7.

### 6.3 MPO-16 and dual-MPO 8-lane optics
**Lane rule (MPO-16):** Tx occupies positions **1–8**, Rx occupies **9–16**.
**Status:** VERIFIED. Sources:
- IEEE 802.3cm 138.10.3, option B: "The transmit optical lanes occupy the leftmost eight positions. The receive optical lanes occupy the rightmost eight positions".\[8\]\[37\]
- QSFP-DD MSA Fig. 16/18 (MPO-16 one-row receptacle).\[38\]
- IEEE 802.3df proposal by Cisco/US Conec for 800GBASE-DR8: "shall use a single-row sixteen-fiber interface … transmit optical lanes occupy the leftmost eight positions".\[39\]

| Optic | Connector | Fibre | Reach | Notes |
|---|---|---|---|---|
| 400GBASE-SR8 (Cl. 138, 802.3cm) | **Option B:** MPO-16 single row; **Option A:** MPO-24 two-row | MMF | 100 m OM4 † | Option A: "sixteen active lanes within 24 total positions. The four center positions in each row are unused. The transmit optical lanes occupy the leftmost four positions in each row" — this is the "24F carrying 16" case. Cisco QDD-400G-SR8-S: "MPO16 APC MMF 100m".\[8\]\[34\]\[37\]\[40\] |
| 800GBASE-DR8 / DR8-2 (Cl. 124 via 802.3df) | MPO-16 APC (offset key) | SMF | 500 m / 2 km † | IEEE text above\[41\] |
| 800G 2×SR4 / 2×DR4 twin-port OSFP (NVIDIA) | **Two** MPO-12/APC | MMF / SMF | 2×SR4 50 m (NVIDIA MMA4Z00-NS title); 2×DR4 500 m | Each MPO uses the §6.2 lane rule; Type-B crossover cords; 1:2 splitter cords also used\[42\]\[43\] |
| 800G SR8 single MPO-16 | MPO-16 | MMF | † | Lane rule as MPO-16 above (PARTIAL for exact lane numbering) |

**Lane numbering within the Tx/Rx blocks** (which Tx lane is in which position) differs between figures (QSFP-DD versus some IEEE drafts). Status: PARTIAL. The engine should test by **position sets** (Tx block → Rx block) and not by lane number.

### 6.4 Dual CS / SN / MDC multi-port optics (QSFP-DD MSA Table 15)
**Status:** VERIFIED for the port grouping (QSFP-DD MSA Rev 7.1 Table 15; Cisco and Arista use these MSAs).\[38\] The per-port Tx/Rx position follows the duplex convention (PARTIAL).

| MDI | Electrical lanes → optical port |
|---|---|
| Dual CS / Dual SN / Dual MDC / Dual duplex LC / Dual MPO-12 ("2 TX + 2 RX fibers" column) | Tx1–Tx4 → **port 1** (left-most); Tx5–Tx8 → **port 2**. Same for Rx. |
| Quad SN / Quad MDC ("4 TX + 4 RX fibers") | Tx1–2 → port 1, Tx3–4 → port 2, Tx5–6 → port 3, Tx7–8 → port 4 |

- Example use: 2×FR4, 2×LR4 and 2×100G-CWDM4 optics use dual CS/SN/MDC.
- The MSA states: "In such cases, Port #1 is always the left-most port".\[38\]
- Dual duplex LC and dual MPO ports are "positioned belly to belly, and the optical connector keys shall be oriented towards the side walls of module".\[38\] The tool should draw the two MPOs on a twin-port QSFP-DD rotated 90°.

### 6.5 Breakout use cases (expected PASS; out of v1 UI scope)
| Case | Physical build | Result |
|---|---|---|
| 40G/100G SR4 → 4× 10G/25G SR | SR4 MPO (female cord) → Type-B trunk / U2 cassette or U1 harness → 4× duplex A-to-B (U2) | PASS. With U1, A-to-A cords are needed (Fluke).\[12\] **Revision 3:** this is true only for a direct U2 transition plugged into the optic. Through a Type B trunk, U1 and U2 both need A-to-A (BO-01 to BO-04). |
| 400G DR4 → 4× 100G-DR (or FR/LR) | MPO-12 APC breakout → 4 duplex LC/APC | PASS (Cisco; Smartoptics "4x100GAUI-2 mode … to enable 400G to 4x 100G break-out")\[27\]\[44\] |
| 400G SR4.2 → 4× 100G SR1.2 | MPO-12 → 4 duplex LC; TR fibre must meet RT | PASS (Cisco)\[34\] |
| 800G twin-port → 2× 400G | Two straight Type-B MPO-12 cords to two 400G single-port optics | PASS (NVIDIA)\[42\]\[45\] |

### 6.6 Duplex Tx/Rx side on the transceiver face (revision 2)
**Status:** VERIFIED for QSFP-DD / QSFP family (QSFP-DD MSA, SFP-DD MSA, QSFP MSA). PARTIAL for SFP/SFP+/SFP28 (secondary summary plus Cisco orientation note; the INF-8074i figure itself was not read).
- QSFP-DD MSA Hardware Rev 7.0 §5.2: "The transmit and receive optical lanes shall occupy the positions depicted in Figure 15 when looking into the MDI receptacle with the connector keyway feature on top." Figure 15 shows duplex LC as **TX (left) | RX (right)**, and MPO-12 as TX 1 2 3 4 … RX 4 3 2 1.
- The SFP-DD MSA (Figure 14) uses the same convention. The QSFP MSA defines the dual-LC orientation in Figure 21b.
- SFP/SFP+: a widely used summary of INF-8074i says "when looking into the optical connectors, the one on the left is the transmitter".
- **Mounting caveat:** Cisco's SFP installation note warns that a device "could have either a latch-up or a latch-down orientation". In a latch-down (inverted) cage, Tx appears on the **right** from the operator's view.

**Tool rule:** each optic port has `latch: up | down`. Tx is on the left looking into the receptacle with the latch or keyway up; mirror it for latch-down. Light starts from the cord end in the module's left (latch-up) bore.

### 6.7 Reaches (revision 2)
Values come from the TIA FOTC IEEE 802.3 multimode and singlemode explorers, IEEE task-force documents and Cisco data sheets. **Status:** VERIFIED for all rows without †. Rows with † were carried over and still need "check datasheet". FOTC table caveats: it lists 100GBASE-SR4 as 100/150 m, which conflicts with IEEE Cl. 95 (use 70/100). One FOTC tab lists 400GBASE-SR4 as 30/50 m, but its own overview page and 802.3db give 60/100 m (VR4 is 30/50 m).

| PMD | Reach | Clause / document |
|---|---|---|
| 10GBASE-SR | 300 m OM3 / 400 m OM4 | Cl. 52 |
| 10GBASE-LR † | 10 km | Cl. 52 |
| 25GBASE-SR | 70 m OM3 / 100 m OM4 | Cl. 112 |
| 25GBASE-LR † | 10 km | Cl. 114 |
| 40GBASE-SR4 | 100 m OM3 / 150 m OM4 | Cl. 86 |
| 100GBASE-SR4 | 70 m OM3 / 100 m OM4 | Cl. 95 (FOTC conflict noted) |
| 100GBASE-LR4 † | 10 km | Cl. 88 |
| 100G-CWDM4 † | 2 km | CWDM4 MSA |
| 100G-PSM4 † | 500 m | PSM4 MSA |
| 200GBASE-SR4 | 70 m OM3 / 100 m OM4 | Cl. 138 |
| 400GBASE-SR8 | 70 m OM3 / 100 m OM4 (OM5 100 m) | Cl. 138 (802.3cm) |
| 400GBASE-SR4.2 | 70 / 100 / 150 m OM3/OM4/OM5 | Cl. 150 (802.3cm) |
| 400GBASE-SR4 | 60 m OM3 / 100 m OM4 | Cl. 167 (802.3db) |
| 400GBASE-VR4 | 30 m OM3 / 50 m OM4 | Cl. 167 (802.3db) |
| 400GBASE-DR4 | 500 m | Cl. 124 (802.3bs) |
| 400GBASE-DR4-2 | 2 km | Cl. 124 (802.3df) |
| 400GBASE-FR4 | 2 km | Cl. 151 (802.3cu) |
| 400GBASE-LR4-6 † | 6 km | Cl. 151 (802.3cu) |
| 400G-LR4-10 † | 10 km | 100G Lambda MSA |
| 800GBASE-SR8 | 60 m OM3 / 100 m OM4 | Cl. 167 (802.3df) |
| 800GBASE-VR8 | 30 m OM3 / 50 m OM4 | Cl. 167 (802.3df) |
| 800GBASE-DR8 | 500 m | Cl. 124 (802.3df) |
| 800GBASE-DR8-2 | 2 km | Cl. 124 (802.3df) |
| 40G SR-BiDi (QSFP-40/100-SRBD, 40G mode) | 100 m OM3 / 150 m OM4 | Vendor (Cisco) |
| 100G SR1.2 BiDi | 70 / 100 / 150 m OM3/OM4/OM5 | Vendor (Cisco); not an IEEE 802.3 PMD per FOTC list |

Where this table differs from a † value in §6.1–§6.3, this table wins.

---

## 7. Pin gender

**Status:** VERIFIED. Sources:
- QSFP-DD MSA: "Two alignment pins are present in each receptacle".\[38\]
- IEEE 802.3: "MPO female plug connector … and an MDI".\[46\]
- Fluke: "all MPO equipment ports are male, so any MPO cable that connects to equipment must have a female connector".\[5\]
- NVIDIA: "Transceivers have alignment pins … The fiber cable has alignment holes".\[47\]
- FOA.

**Rules:**
- **Mating rule:** every mated MPO pair = exactly one male + one female.
  - Male-to-male → **FAIL** (pins collide; risk of damage).
  - Female-to-female → **FAIL** (no alignment; high loss).
- **Transceivers:** male (pinned). Equipment cords plugging into them must be female.\[9\]
- **Cassettes and trunks:**
  - Common practice: male cassette rear MPO, female trunk. Example: Panduit universal cassette "MPO Male" (competitor).\[48\]
  - FOA describes the permanently installed cable ending in pinned connectors inside adapters ("plug and jack") with unpinned cords.\[10\]
  - Both are valid; the engine should enforce only the male/female pairing rule and flag unusual combinations as warnings.
  - **House default (owner decision, 2026-10-16):** cassette rear MPO = male, MPO cable = female. In the tool a gender mismatch is a **note**, never a change to the light-path verdict. Gender is kept in the data for a future parts-request output.
- **MPO-16:** a distinct pin and keying system. US Conec: "unique keying feature … standardized by TIA 604-18 (FOCIS 18) … ensures proper mating of the MTP®-16 connector without inadvertently mating the 16 fiber connector hardware with standard MPO compliant hardware". US Conec also lists an "elliptical guide pin shape". Key offset to the left (EXFO, Fluke).\[5\]\[11\]\[49\]\[50\]

---

## 8. Expected end-to-end results (unit-test fixtures)

**Engine algorithm (derived from §2–§5; consistent with every TIA FOTC component list):**
1. Compose position maps through every component, applying Type-A adapters as `i` and Type-B adapters as `N+1−i`. **Revision 3:** a plug mated into an optic MPO receptacle also applies `N+1−i`, and duplex optics put Tx on B and Rx on A (§3-1).
2. **Duplex channel:** for each port *p* at end 1, trace both fibres to end 2. PASS if both arrive at the same far-end port *p′*, the total inversion count is odd (Tx→Rx), and *p′ = p* (or *p′* is the documented relabelled port for an inverted Method-B cassette). FAIL if the pair is split across ports or the inversion count is even.
3. **Parallel channel:** PASS if the Tx position set of end 1 maps onto the Rx position set of end 2 (e.g. {1–4}→{9–12} or {1–8}→{9–16}).
4. **Mechanical:** PASS only if every mated MPO pair is one male + one female with the same footprint (MPO-12/8/24 vs MPO-16/32); warn on APC through a key-up/up adapter.

### 8.1 Expected PASS
| ID | Channel (end 1 → end 2) | Why |
|---|---|---|
| P-A | A-to-B cord → Type A cassette (Type A adapter) → Type A trunk → Type A cassette → **A-to-A** cord | Backbone straight (0 flips) + 1 cord flip = odd (TIA FOTC Method A)\[2\] |
| P-B | A-to-B → Type A-transition cassette + **Type B adapter** → Type B trunk → Type B adapter + cassette (one inverted, or B1/B2 pair) → A-to-B | Three reversals = 1 net pair inversion + 2 cord flips = odd (TIA FOTC Method B)\[2\] |
| P-C | A-to-B → Type A cassette → **Type C trunk** → Type A cassette → A-to-B | Trunk flip + 2 cords = odd (TIA FOTC Method C)\[2\] |
| P-U1 | A-to-B → **U1** cassette (Type A adapter) → **Type B trunk** → U1 cassette → A-to-B; port *p*→port *p* | TIA FOTC U1; Fluke; Panduit (competitor)\[2\]\[12\] |
| P-U2 | A-to-B → **U2** cassette (Type B adapter) → Type B trunk → U2 cassette → A-to-B | TIA FOTC U2; Fluke\[2\] |
| P-ArrA | SR4 → Type A array cord → Type A adapter → Type A trunk → Type A adapter → **Type B** array cord → SR4 | One Type-B element = odd (TIA FOTC Method A array)\[2\] |
| P-ArrB | SR4 → Type B cord → Type B adapter → Type B trunk → Type B adapter → Type B cord → SR4 | Five Type-B elements = odd (TIA FOTC Method B array)\[2\] |
| P-ArrC | SR4 → Type B cord → Type A adapter → Type C trunk → Type A adapter → **Type C** cord → SR4 | Two C flips cancel; one B = odd (TIA FOTC Method C array)\[2\] |
| P-Direct12 | SR4/DR4/PSM4 ↔ single Type B MPO-12 cord (female both ends) | 1→12 maps Tx{1–4}→Rx{12–9} (FOA, NVIDIA)\[10\]\[51\] |
| P-Direct16 | SR8/DR8 ↔ single Type B MPO-16 cord | 1→16 maps Tx{1–8}→Rx{16–9} (PARTIAL map; see §2.5) |
| ~~P-Break-U2~~ | ~~SR4/DR4 → Type B trunk → U2 cassette → 4× A-to-B → 4 duplex optics~~ | **Withdrawn in revision 3:** this channel FAILS (BO-03). With A-to-A cords it passes (BO-04). |

### 8.2 Expected FAIL (known-bad combinations / field mistakes)
| ID | Mistake | Failure mode |
|---|---|---|
| F-1 | Method A with **A-to-B cords at both ends** | Even inversions → Tx→Tx |
| F-2 | Method A with A-to-A at both ends | 0 inversions → Tx→Tx |
| F-3 | **Type A trunk/cord directly between two parallel optics** (e.g. SR4↔SR4) | Tx{1–4}→Tx{1–4} (FOA: must "reverse conductors at some point")\[10\] |
| F-4 | **Type C** cord/trunk between two parallel optics | Pair flip sends Tx1→pos 2 (Tx) (Fluke)\[12\] |
| F-5 | Method B built with **both cassettes un-inverted and identical**, labels read as same port | Polarity OK but port *p* lands on port 7−*p* → mis-patching. Flag as a "port mismatch" failure. |
| F-6 | Mixing **U1 cassette at one end and a standard Type A cassette** at the other over a Type B trunk | Port 2's two fibres land on far-end ports 6 and 1 → split pair (derived) |
| F-7 | U1 cassette with **Type B adapter**, or U2 with Type A adapter | Wrong transition/adapter pairing (TIA FOTC lists fixed pairings) |
| F-8 | Using the universal cassette with a **Type A trunk** | U1 needs the Type-B reversal; with a Type A trunk LC1→LC1 → Tx→Tx |
| F-9 | U1 cassette for **direct breakout with A-to-B cords** | Fluke: U1 breakout needs A-to-A\[12\]. Revision 3: the same applies to U2 through a Type B trunk (BO-01, BO-03). |
| F-10 | **MPO-16 into an MPO-12** adapter/port (or vice versa) | Mechanical: offset key / different pins (US Conec FOCIS-18)\[49\]\[50\] |
| F-11 | **Pin-to-pin** (male-male) or **no-pin to no-pin** mating | Mechanical/alignment failure (FOA, Fluke) |
| F-12 | Male-pinned cord into a transceiver | Transceiver is already pinned → male-male |
| F-13 | **APC MPO through a Type B (key-up/up) adapter** | Angle mismatch (Fluke, FOA) → high loss / reflectance (warning)\[11\]\[12\] |
| F-14 | MPO-24 Type A trunk assumed to be "1→1" | Actually 1→13 (row swap). Lanes cross rows (PARTIAL; §2.6). |
| F-15 | Mixing components from different methods generally | Fluke: "you can't mix and match components from different methods"; TIA FOTC: methods "may not be interoperable"\[2\]\[12\] |

**Revision 2 changes to the rows above:**
- **F-5** is revised: it applies only to **two identical upright Method B cassettes**, and it is **WARN (port mismatch, light path OK)**, not FAIL.
- **F-11 / F-12** (gender): the engine flags them; the tool shows a note and the light-path verdict is unchanged (owner decision, §7).
- **F-13** is upgraded from warning to **BLOCK** (§3.1).
- **F-14** is restated as F-14 (revised) below.

### 8.3 Revision 2 additions: expected PASS
| ID | Channel | Expected | Status of underlying maps |
|---|---|---|---|
| P-U1-16 | MPO-16 · 16F: U1-16 cassette → Type A adapter → Type B 16F trunk → Type A adapter → U1-16; A-to-B cords | Port *p* → *p*, Tx→Rx | Derived (provisional) |
| P-U1-24 | MPO-24 · 24F: U1-24 (p / 25−p) both ends, Type B 24F trunk, Type A adapters | Port *p* → *p* | Derived (provisional) |
| P-U1-24-16F | MPO-24 · 16F: §4.3a(c) cassette both ends, Type B 24F trunk | Port *p* → *p* (8 ports) | Derived (provisional) |
| P-U2-12 | U2 (12,1,11,2,…,8,5,7,6) both ends, Type B trunk, Type B adapters, A-to-B cords, **UPC only** | Port *p* → *p* | VERIFIED order |
| P-MB-INV | Method B, far cassette inverted | Panel position *p* → *p*; printed label 7−p | VERIFIED |
| P-MB-B1B2 | Method B, B1/B2 matched pair | Port *p* → *p* | **PARTIAL (revision 3):** B2 = 11,12,9,10,7,8,5,6,3,4,1,2, one competitor numeric source (§3-2, MB-03). Ship with a "partial" badge. |
| P-APC-PAR | SM APC DR4: Type B cord – Type A adapter – Type A trunk – Type A adapter – Type A cord | PASS (odd Type B count, all key-up/key-down) | VERIFIED |
| P-SR4.2 | QDD-400G-SR4.2-BD ↔ same, direct Type B MPO-12 cord, UPC | TRk lands on RTk | VERIFIED |
| P-SR8-24A | 400G SR8 option A, MPO-24 Type B cord, direct | Row-1 Tx 1–4 → row-2 Rx 21–24; row-2 Tx 13–16 → row-1 Rx 9–12 | PARTIAL (24F Type B) |

### 8.4 Revision 2 additions: expected FAIL / WARN / BLOCK
| ID | Channel | Expected |
|---|---|---|
| F-5 (revised) | Method B with two identical **upright** cassettes | WARN: port *p* → 7−p, light path OK |
| F-14 (revised) | "24F Type A = 1→1" assumption: SR8 option-A direct link through a 24F Type A cord | FAIL: rows swap, so row-1 Tx lands on row-2 Tx positions 13–16 |
| F-APC-1 | Any key-up/key-up adapter with APC on either side | **BLOCK** (not buildable) |
| F-APC-2 | U2 or Method B preset with polish = APC | **BLOCK** |
| F-APC-3 | APC mated to UPC | **BLOCK** |
| F-U1-24ROW | Per-row 24F U1 pairing (1/12…, 13/24…) with Type B 24F trunk | FAIL/WARN: port *p* → *p*+6 |
| F-U1-24-A | U1-24 (p / 25−p) with a 24F Type A trunk | FAIL: port *p* → 13−p |
| F-24STRAIGHT | Straight 24F cassettes both ends, 24F Type A trunk | FAIL: no Tx/Rx crossover, port *p* → *p*+6 |
| F-U1U2-MIX | U1 cassette one end, U2 the other, each with its matching adapter | **Revised in 2.1:** WARN "mixed methods" (light lands correctly; TIA and Fluke say not to mix methods). BLOCK if APC, because U2 uses a key-up/key-up adapter. |
| F-SR1.2-SRBD | QSFP-100G-SR1.2 ↔ QSFP-40/100-SRBD | FAIL (non-interoperable optics, per Cisco) |
| F-LATCH | SFP in a latch-down cage modelled as latch-up | Tx/Rx sides mirrored; must FAIL if the engine ignores latch |

---

## 9. Base conversions and breakout trunks

**v1 scope:** conversion trunks and multi-MPO cassettes are out of scope for v1 (see Scope). The single-MPO cassettes in §4.3a and §4.5 cover 16F and 24F instead. The research below is kept for a later version.

| Conversion | Mapping | Status |
|---|---|---|
| 12F MPO → 8F use | Use positions 1–4 and 9–12; 5–8 dark (Fluke) | VERIFIED\[13\] |
| 2×12F → 3×8F (Base-12 to Base-8) | The 4 unused centre fibres of each 12F trunk (positions 5–8) are combined into the third 8F port (Panduit spec, competitor; Fluke confirms the product class: "transition two 12-fiber MPOs to three 8-fiber MPOs") | **UNVERIFIED** at position level. No published position map found. Engineering must supply.\[52\]\[53\] |
| 24F → 3×8F | Products exist (FS, competitor; "Type B") | UNVERIFIED (no map)\[54\] |
| 24F → 2×12F | Products exist (FS, competitor; "Type A") | UNVERIFIED. Natural design: row 1 (1–12) → 12F#1, row 2 (13–24) → 12F#2, but polarity per vendor.\[54\]\[55\] |
| 16F → 2×8F | Panduit 16F breakout cassettes and NVIDIA twin-port splitter usage imply 1–4/13–16 and 5–8/9–12 groupings | UNVERIFIED |
| 24F carrying 16 (SR8 option A) | Each row: Tx 1–4 (13–16), Rx 9–12 (21–24), centre dark (IEEE 802.3cm) | VERIFIED (IEEE text + 2 IEEE contributions)\[8\]\[37\]\[56\] |

---

## 10. TIA-598 fibre colour code

**Status:** VERIFIED for 1–12. Sources: FOA; Prysmian; Wikipedia/TIA-598-C summary; Corning AEN029 (competitor).\[57\]

| Pos | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Colour | Blue | Orange | Green | Brown | Slate | White | Red | Black | Yellow | Violet | Rose | Aqua |

**13–24:** the same 12 colours with a **black tracer/stripe**, except fibre 20 (black). Status PARTIAL for fibre 20:
- **The standard:** ANSI/TIA-598-D (approved 9 July 2014) lists position 20 as "Black with White Tracer", with a footnoted alternative that allows a yellow tracer.
- **Vendors differ:** Prysmian's colour guide gives "Black w/Yellow Stripe". Corning (competitor) describes fibre 20 as "opaque (transparent coating) with black tracer".

Recommendation: default to TIA-598-D's black with white tracer, accept yellow as an allowed alternative, and let the house cable spec decide.

**Revision 2 definitive table.** Choose the colour set by connector: MPO-16 → TIA-598-D-1 colours for 13–16; MPO-24 → tracer colours.

| Pos | 24F unit (TIA-598-D) | MPO-16 (TIA-598-D-1) |
|---|---|---|
| 13 | Blue / black tracer | **Olive** |
| 14 | Orange / black tracer | **Magenta** |
| 15 | Green / black tracer | **Tan** |
| 16 | Brown / black tracer | **Lime** |
| 17 | Slate / black tracer | — |
| 18 | White / black tracer | — |
| 19 | Red / black tracer | — |
| 20 | Black / **white** tracer | — |
| 21 | Yellow / black tracer | — |
| 22 | Violet / black tracer | — |
| 23 | Rose / black tracer | — |
| 24 | Aqua / black tracer | — |

- **Status:** 13–16 olive/magenta/tan/lime is now **VERIFIED** (FOA reference page, FOA cross-reference PDF, standards catalogue listing of D-1, secondary references). The fibre-20 tracer remains PARTIAL; the yellow alternative was not re-verified.
- TIA-598-D-1 (August 2018) is "Optical Fiber Color Coding in Cable — Addendum 1, Additional Colors for Elements 13-16". TIA-598-D-2 (March 2018) covers OM5 jacket colour. No TIA-598-E was found; ANSI/TIA-598-D (2014) is active with two addenda.
- An FOA cross-reference sheet gives positions 29–32 as the same four colours with a black tracer.
- **IEC differs:** IEC 60304 / DIN 0888 order (per FOA) is blue, yellow, red, white, green, violet, orange, slate, aqua, black, brown, pink. Some ring-marking practices leave fibre 20 uncoloured. The tool uses TIA-598 only.

**MPO-16 positions 13–16:** these extra colours come from ANSI/TIA-598-D-1, "Addendum 1, Additional Colors for Elements 13-16" (TIA, August 2018). The FOA quotes them: "Fibers 13-16 are specified for 16 fiber MPO connectors as follows: 13: Olive, 14: Magenta, 15: Tan, 16: Lime." This differs from the black-stripe convention used for 24-fibre ribbons. Status PARTIAL: the addendum exists, but this pass did not check its text directly. For an MPO-16 view, use olive/magenta/tan/lime.

---

## 11. Open questions / unverified items for engineering review

**Revision 2 status of the revision-1 list:**

| # | Item | Revision 2 outcome |
|---|---|---|
| 1 | MPO-24 row maps | Type A 1→13 VERIFIED; Type B and C still PARTIAL (see open item 2 below) |
| 2 | MPO-16 Type A/B maps | Still PARTIAL (derived), now consistent with the QSFP-DD MSA lane figure (§2.5) |
| 3 | MPO-32 maps | Unchanged: none found. Out of v1 scope |
| 4 | Conversion assemblies | Out of v1 scope (§9) |
| 5 | U2 order beyond fibre 8 | **Resolved:** VERIFIED (§4.4) |
| 6 | Universal 16F/24F | Single-MPO maps derived (§4.3a); no product found (see open item 3 below) |
| 7 | Corning "Universal" wiring | Unchanged; not modelled |
| 8 | Harness leg labelling | Leg/position mapping VERIFIED; A/B ferrule convention not standardised (§5.4) |
| 9 | Duplex Tx side; SN/MDC | Tx-left VERIFIED for QSFP family, PARTIAL for SFP (§6.6). SN/MDC out of v1 scope |
| 10 | MPO-16 lane numbering inside Tx/Rx blocks | Unchanged; test by position sets |
| 11 | Reaches † | Most re-verified (§6.7); remaining † listed there |
| 12 | Colours | 13–16 VERIFIED; fibre 20 tracer still PARTIAL (§10) |
| 13 | A-to-B terminology | **Resolved:** label "A-to-B (standard)" with tooltip |
| 14 | Gender default | **Resolved by owner:** male cassette, female cable (§7) |

**Open items after revision 2:**

> **Revision 3:** item 1 is resolved in algebra (§3-1), with bench and TIA-figure checks open (R3-O1, R3-O2). Item 5 is still open (R3-O4). For new items see §3-5.

1. **U1 vs U2 direct breakout.** The position algebra makes "U1 + Type A adapter" and "U2 + Type B adapter" externally identical, but Fluke says U1 needs A-to-A cords for direct breakout and U2 does not. Confirm the cassette-rear frame convention against the TIA-568.3-E figures (§4.4).
2. **24F Type B and Type C tables.** Only one competitor table reproduces TIA-568.3-D. Obtain the TIA-568.3-E / TSB-5069 text to verify (§2.6).
3. **Published 16F/24F single-MPO universal cassette products.** None found. Derived maps ship with a "derived" badge (§4.3a).
4. **IEC part number for the 1×16 MPO** (61754-7-3 vs 7-4) (§1.1).
5. **SFP MSA (INF-8074i) figure for the Tx side.** Only a secondary summary was read (§6.6).
6. **Harness A/B ferrule convention.** Not standardised; keep it configurable (§5.4).
7. **MPO-16 adapter availability** (aligned vs opposed key), and confirmation that no Type C MPO-16 exists (§2.5).
8. **Per-part polish** for 800G SR8/VR8 and 2×SR4/2×VR4, and the SR4.2 UPC vs APC conflict (§6.0).
9. **Fibre-20 tracer alternative (yellow)**, and whether a TIA-598-E is in ballot (§10).
10. **Remaining † reaches** in §6.7, plus the TIA FOTC table conflicts on 100GBASE-SR4 and 400GBASE-SR4.
11. **MPO-32** polarity maps (unchanged; out of scope).
12. **Corning "Universal" wiring** internal map (unchanged; not modelled).

---

## 12. Caveats
- The TIA-568.3-E text itself is paywalled. Method composition here is taken from TIA's own FOTC summary, cross-checked against Fluke, FOA and VIAVI. TIA calls these "sample" methods; others exist.\[8\]\[59\]
- IEEE lane text was confirmed from published task-force documents and comment resolutions, not the purchased 802.3-2022 standard. Final clause wording may differ slightly; the position sets are consistent across all of them.
- Several detailed maps (universal 8F/16F/24F, Method B "BN" cassette, MPO-24 tables) exist publicly only in competitor documents. They are labelled as such and were used for cross-checking, in line with the brief.
- **Revision 2:**
  - Competitor-sourced claims used only as cross-checks include the 24F TIA tables, the Method B "far end" cassette, the "Type A adapters MUST be used with APC" statement, and Siemon/CommScope summaries of TIA-568.3-E.
  - "Precision OT" pages carry Belden branding and are reclassified as competitor sources.
  - The IEEE P802.3cm "MDI Choices" contribution was submitted by a cabling vendor, but it is a task-force record.
  - TIA-568.3-D/E, TIA-598-D-1 and TSB-5069 are paywalled and were read only through summaries.
  - Revision 2 sources are identified by document title inline; URLs are pending a citation pass (see "Revision 2 sources" below).

## Sources

1. [ANSI/TIA-568.3-E Introduces New Polarity Methods - Siemon](https://www.siemon.com/en/ansi-tia-introduces-new-polarity-methods/)
2. [ANSI/TIA-568.3-E: Optical Fiber Cabling and Components Standard - Fiber Optics Tech Consortium](https://www.tiafotc.org/tia-standards-update/tia-568-3-e/)
3. <https://img-en.fs.com/file/white_paper/understanding-fiber-polarity.pdf>
4. [MTP vs MPO: Differences, Compatibility & Polarity Guide](https://www.digi-electronics.com/en/blogs/mtp-vs-mpo-differences-compatibility-polarity-guide/749.html)
5. [MPO vs MTP Fiber Connectors Explained](https://www.flukenetworks.com/expertise/learn-about/multi-fiber-push-mpo-connectors)
6. [MPO Connector Polarity](https://www.senko.com/mpo-connector-polarity-tia-568/)
7. [Polarity Methods vs. Cable Types for MPO cables](https://store.cablesplususa.com/mtp-brand-mpo-polarity-methods-vs-cable-types/)
8. <https://grouper.ieee.org/groups/802/3/cm/public/May18/swanson_3cm_01b_0518.pdf>
9. [101 Series: 12-Fiber MPO Polarity](https://www.flukenetworks.com/blog/cabling-chronicles/101-series-12-fiber-mpo-polarity)
10. [The FOA Reference For Fiber Optics - Testing Cables with Multifiber/Array Connectors](https://www.thefoa.org/tech/ref/testing/test/test-MPO.html)
11. [MPO connector basics and best practices](https://www.cablinginstall.com/home/article/16468511/mpo-connector-basics-and-best-practices)
12. [Fiber Polarity Basics](https://www.flukenetworks.com/blog/cabling-chronicles/b-c-s-fiber-polarity)
13. [Getting 12- and 8-Fiber MPO Polarity Right](https://www.flukenetworks.com/blog/cabling-chronicles/getting-12-and-8-fiber-polarity-right)
14. [Get to Know Your MPO](https://www.precisionot.com/get-to-know-your-mpo/)
15. [What Is an MPO Adapter? Types, Polarity & Selection Guide](https://www.opticalfiberconnector.com/info/what-is-an-mpo-adapter-types-polarity-103541699.html)
16. [MPO/MTP Polarization Types Explained (Type A/B/C)](https://www.ampcom.com/blogs/tech-lab/mpo-mtp-polarization-types-explained-type-a-b-c)
17. [400G-SR8 MDI Definition and Lane Assignments (IEEE P802.3cm contribution, May 2018)](https://grouper.ieee.org/groups//802/3/cm/public/May18/swanson_3cm_01_0518.pdf)
18. [MPO Best Practices DECEMBER 2023 Rev. 01 senko.com Application Note Issued by:](https://www.senko.com/wp-content/uploads/2023/11/Application-Note_MPO-Best-Practices.pdf)
19. [MPO Connectors (Multi-Fiber Push On): An Introduction - Nexconec](https://blog.nexconec.com/mpo-connectors-multi-fiber-push-on-introduction/)
20. [Panduit](https://www.panduit.com/content/dam/panduit/en/products/media/7/67/567/9567/110609567.pdf)
21. [Simplifying Fiber Cabling with FS's Universal Polarity Products](https://community.fs.com/article/understanding-universal-polarity-in-mtp-cabling-system.html)
22. [Opticom Series 4-to-1 Breakout Fiber Optic Cassettes](https://www.panduit.com/content/dam/panduit/en/products/media/2/82/282/2282/111242282.pdf)
23. [MultiFiber™ Pro Optical Power Meter and Fiber Test Kits](https://www.flukenetworks.com/datacom-cabling/fiber-testing/multifiber-pro-optical-power-meter-and-fiber-testing-kits)
24. [MultiFiber™ Pro](https://www.flukenetworks.com/content/datasheet-multifiber-pro)
25. [EAI/TIA 568 B.3 For Fiber Optics](https://www.thefoa.org/tech/tia568b3.htm)
26. [MMA4Z00-NS 800Gb/s Twin-port OSFP, 2x400Gb/s Multimode SR8, 50m](https://docs.nvidia.com/mma4z00-ns-800gb-s-twin-port-osfp-2x400gb-s-multimode-sr8-50m-12-07-2023.pdf)
27. [Cisco Transceiver Modules - Cisco 400G QSFP-DD Cable and Transceiver Modules Data Sheet](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/datasheet-c78-743172.html)
28. [Clause 138.10.3 MDI (IEEE P802.3cd contribution, January 2017)](https://www.ieee802.org/3/cd/public/Jan17/kolesar_3cd_01_0117.pdf)
29. [WWW.PSM4.ORG 100G PSM4 Specification Parallel Single Mode 4 lane 9/15/2014](http://www.psm4.org/100G-PSM4-Specification-2.0.pdf)
30. [400 Applications • 400G Ethernet • Data Center Interconnect](https://www.comnen.com/wp-content/uploads/2025/04/COMNEN-400G-QSFP112-DR4-LPO-Optical-Transceiver-Datasheet.pdf)
31. [Optics Modules and Cables Data Sheet Key Features](https://www.arista.com/assets/data/pdf/Datasheets/Transceiver-Data-Sheet.pdf)
32. [400G Transceivers and Cables Q&A www.arista.com 1](https://www.arista.com/assets/data/pdf/Datasheets/Arista-400G_Optics_FAQ.pdf)
33. [Choosing 400G optics: SR, DR, FR and LR, and what each one costs you in fibre](https://optics.carritech.com/choosing-400g-optics/)
34. [Cisco 400G QSFP-DD Cable and Transceiver Modules](https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/datasheet-c78-743172.pdf/1000)
35. [MDI Lane Assignments for 400GBASE-SR4.2](https://www.ieee802.org/3/cm/public/September18/ingham_3cm_01_0918.pdf)
36. [400GBASE-SR4.2 BiDi QSFP-DD 150m](https://edgeoptic.com/products/400g-qsfp-dd/bidi-400g-qsfp-dd-150)
37. [100Gbps MMF MDI Specifications (IEEE P802.3db ad hoc, July 2020)](https://www.ieee802.org/3/db/public/adhoc/presentations/swanson_3db_adhoc_01_073020.pdf)
38. <http://www.qsfp-dd.com/wp-content/uploads/2024/07/QSFP-DD-Hardware-Rev7.1.pdf>
39. [800GBASE-DR8 MDI proposal (IEEE P802.3df contribution, July 2022)](https://grouper.ieee.org/groups/802/3/df/public/22_07/nowell_3df_01b_2207.pdf)
40. [IEEE P802.3cm D3.0 400 Gb/s over Multimode Fiber Initial ...](https://www.ieee802.org/3/cm/comments/P802p3cm_D3p0_comments_final_by_clause.pdf)
41. [MTP MPO connector: Types, Polarity & Data Center Use](https://www.cobtel.com/info/mpo-fiber-connector-types-polarity-and-applica-103524010.html)
42. [MMS4X00-NM 800Gbps Twin-port OSFP 2x400Gb/s InfiniBand and Ethernet](https://docs.nvidia.com/nvidia-mms4x00-nm-800gbps-twin-port-osfp-2x400gb-s-single-mode-dr8-500m-12-07-2023.pdf)
43. [MMA4Z00-NS 800Gb/s Twin-port OSFP, 2x400Gb/s Multimode 2xSR4, 50m](https://docs.nvidia.com/networking/display/mma4z00-ns-800gb-s-twin-port-osfp-2x400gb-s-multimode-2xsr4-50m.pdf)
44. [SO-QSFP-DD-4C-DR4-M](https://smartoptics.com/wp-content/uploads/2022/12/so-qsfp-dd-4c-dr4-m-r5.5.pdf)
45. [Overview](https://networking-docs.nvidia.com/800gmma4z00ns/overview)
46. [MDI Lane Assignments for 400GBASE-SR4.2 (IEEE P802.3cm contribution, Sept 2018)](https://grouper.ieee.org/groups/802/3/cm/public/September18/ingham_3cm_01_0918.pdf)
47. [MMA4Z00-NS-T 800Gb/s Twin-port OSFP, 2x400Gb/s Multimode, 50m](https://docs.nvidia.com/networking/display/mma4z00-ns-t-800gb-s-twin-port-osfp-2x400gb-s-multimode-50m.pdf)
48. [Panduit](https://www.panduit.com/en/products/fiber-optic-systems/fiber-optic-panels-cassettes-enclosures/fiber-optic-cassettes/fhczo-12-10u.html)
49. [MTP®-16 Connectors](https://www.usconec.com/files/literature/MTP-16_Connector_Handout.pdf)
50. [MPO Fiber Guide 2026: MPO vs MTP, Polarity & Sourcing Tips](https://www.wolontek.com/mpo-fiber-guide-mpo-vs-mtp/)
51. [NVIDIA MMS4A20 800Gbps, DR4 Single-port OSFP, MPO, 1310nm Single Mode, RHS (500m) Transceiver](https://docs.nvidia.com/networking/display/9iat0mosfp800sprhs/overview)
52. [www.panduit.com S P E C I F I C A T I O N S H E E T s t a n d a r d s](https://www.panduit.com/content/dam/panduit/en/products/media/8/08/508/0508/101770508.pdf)
53. [All Fiber Roads Divisible by 2 and 8 Test With Fluke Network’s MultiFiber™ Pro](https://www.flukenetworks.com/blog/cabling-chronicles/all-fiber-roads-divisible-2-and-8)
54. [MTP®/MPO 12/16/24 Fibers Conversion Cables - FS](https://www.fs.com/c/mtp-mpo-breakouts-3089)
55. [1m (3ft) MTP® Conversion Cable, MTP®-24 APC (Female) to 2 x MTP®-12 APC (Female), 24 Fibers, Single Mode (OS2), Plenum (OFNP), 0.35dB Max, Type A, Yellow - FS.com](https://www.fs.com/products/165855.html)
56. [400G-SR8 MDI Definition and Lane Assignments, rev b (IEEE P802.3cm contribution, May 2018)](https://www.ieee802.org/3/cm/public/May18/swanson_3cm_01b_0518.pdf)
57. [Fiber Optic Color Code Chart (TIA-598)](https://www.dysfiber.com/blog/cable-selection/fiber-optic-color-code)
58. [What is MTP®/MPO Fiber Polarity?](https://community.fs.com/blog/mtp%C2%AEmpo-polarity.html)
59. [Recent changes to ANSI/TIA-569-E and ANSI/TIA-568.3-E Standards](https://www.dintek.com.tw/index.php/dintek-articles/recent-changes-to-ansi-tia-569-e-and-ansi-tia-568-3-e-standards)

### Revision 2 sources (titles only; URLs pending citation pass)
- QSFP-DD MSA, QSFP-DD Hardware Specification Rev 7.0 (§5.2, §5.2.1, Figure 15, Table 15)
- SFP-DD MSA Hardware Specification (Figure 14); QSFP MSA (Figure 21b); SFF INF-8074i summary
- TIA FOTC, IEEE 802.3 multimode and singlemode application explorers
- IEEE P802.3cm task-force contribution "400GBASE-SR8 MDI Choices" (May 2018); IEEE 802.3 NGMMF reflector thread
- Fluke Networks, "Are you ready for 400G Ethernet?"; Fluke Networks, "Fiber Polarity Basics"
- EXFO, "MPO connector basics and best practices" (Cabling Installation & Maintenance)
- Senko, "Fiber Optic Polarity Guide for VSFF Connectivity" (Oct 2023, Rev. 01); Senko TIA polarity note
- FOA reference pages (APC multimode, TIA-598 colour code, colour cross-reference sheet)
- Arista, "400G Transceivers and Cables Q&A"
- Cisco, "Fiber Optic Transceiver Breakout Cable Ordering Guide: Cisco Nexus"; Cisco 100G QSFP data sheet; Cisco SFP installation note
- Juniper, cable specification table for 40G/100G breakout
- Sylex, "Is the 24 fibre connectivity method really clear?"
- ModuleTek, APC interconnection application note
- Metro Sales Solutions, "Fiber Polarity in MPO/Cassette Systems"; LANshack cassette tutorial
- EDGE Optic, "MTP MPO cables – All Basics You need to know"
- Competitor (cross-check only): Belden-branded "Precision OT" pages; FS.com white paper reproducing TIA-568.3-D 24F tables; competitor "Method B – Far End" 24F cassette listing

### Revision 3 sources

**Standards / MSA bodies**
- TIA/EIA-568-B.3 (2000) — https://www.csd.uoc.gr/~hy435/material/TIA-EIA-568-B.3.pdf
- ANSI/TIA-568.3-D (2016), shared copy — https://pdfcoffee.com/tia-5683-d-final-pdf-free.html
- ANSI/TIA-568.3-E preview (Accuris) — https://store.accuristech.com/pip/products/preview/2592883
- TIA FOTC, "ANSI/TIA-568.3-E" — https://www.tiafotc.org/tia-standards-update/tia-568-3-e/
- QSFP-DD MSA Hardware Rev 7.0 — http://www.qsfp-dd.com/wp-content/uploads/2023/09/QSFP-DD-Hardware-Rev7.0.pdf
- SFP-DD MSA Rev 4.2 / 5.2 — http://sfp-dd.com/wp-content/uploads/2020/08/SFP-DDrev4.2.pdf ; http://sfp-dd.com/wp-content/uploads/2023/10/SFP-DDrev5.2.pdf
- QSFP+ MSA hardware (copy) — https://fluxlight.com/content/Tech-Docs/QSFP%20MSA.PDF
- IEEE 802.3by plenary, 25G PHY types — https://www.ieee802.org/3/by/public/Mar15/slavick_3by_02a_0315.pdf
- IEEE 802.3 400G SG reflector, breakout — https://grouper.ieee.org/groups/802/3/400GSG/email/msg00112.html
- USPTO US12130480B2 — https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12130480

**Non-competitor industry**
- Fluke Networks, "Fiber Polarity Basics for Duplex Applications" — https://www.flukenetworks.com/blog/cabling-chronicles/b-c-s-fiber-polarity
- Senko, "Fiber Optic Polarity Guide for VSFF Connectivity" — https://www.senko.com/wp-content/uploads/2023/10/Application-Note_Fiber-Optic-Polarity-Guide-for-VSFF-Connectivity.pdf
- NVIDIA MMA1B00-C100D spec, optical connector appendix — https://docs.nvidia.com/networking/display/MMA1B00C100DSpec/Appendix+Optical+Connector+and+Patch+Cable
- Cisco 40GBASE QSFP data sheet — https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/data_sheet_c78-660083.html
- Cisco breakout cable ordering guide — https://www.cisco.com/c/dam/en/us/products/collateral/interfaces-modules/transceiver-modules/fiber-optic-trans.pdf
- Cisco 25GE/100GE white paper — https://www.cisco.com/c/en/us/products/collateral/switches/catalyst-9000/nb-09-25ge-100ge-wp-cte-en.html
- Cisco 400G QSFP-DD data sheet — https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/datasheet-c78-743172.html
- Cisco 100G SR1.2 BiDi AAG — https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/100gbps-bidi-plug-transceiver-aag.html
- Cisco 100GBASE QSFP data sheet — https://www.cisco.com/c/en/us/products/collateral/interfaces-modules/transceiver-modules/datasheet-c78-736282.pdf
- Cisco 100G optics cable ordering guide — https://www.cisco.com/c/dam/en/us/products/collateral/interfaces-modules/transceiver-modules/panduit-cable-og-100g-optics.pdf
- Arista 100G Q&A — https://www.arista.com/assets/data/pdf/Arista100G_TC_QA.pdf
- Arista 400G Q&A — https://www.arista.com/assets/data/pdf/Datasheets/Arista-400G_Optics_FAQ.pdf
- Arista 800G Q&A — https://www.arista.com/assets/data/pdf/Datasheets/Arista-800G_Optics_FAQ.pdf
- Arista transceiver data sheet — https://www.arista.com/assets/data/pdf/Datasheets/Transceiver-Data-Sheet.pdf
- Arista 25G white paper — https://www.arista.com/assets/data/pdf/Whitepapers/25GEthernet_Whitepaper.pdf
- Juniper, "Optics Rollouts Propel the 400G Era" — https://blogs.juniper.net/en-us/service-provider-transformation/optics-rollouts-propel-the-400g-era
- Intel 400G DR4 QSFP-DD specifications — https://www.intel.com/content/www/us/en/products/sku/135329/intel-silicon-photonics-400g-dr4-qsfpdd-optical-transceiver/specifications.html
- Extreme Networks 25G SR SFP28 spec — https://documentation.extremenetworks.com/pluggable/GUID-B0092784-C292-4B82-A357-78FA02468DF1.shtml
- Extreme Networks KB, 100G-SR4 4×10G — https://extreme-networks.my.site.com/ExtrArticleDetail?an=000117211
- Jabil 400G SR4 data sheet — https://www.jabil.com/dam/jcr:074e256c-7337-4bab-9f01-9297a8ef2847/Jabil_400G%20SR4%20QSFP-DD%20Optical%20Transceiver_01.pdf
- WB Networks polarity blog — https://wbnetworks.com.au/blog/Polarity-method-selection-MTP-MPO
- Cisco community thread — https://community.cisco.com/t5/xr-os-and-platforms/asr9k-qsfp-40g-sr4-breakout-4x10-support/m-p/3771280/highlight/true
- Third-party optic vendors (corroboration only): EdgeOptic KB https://edgeoptic.com/kb_article/bidi-100g-srbd-vs.-100g-sr1.2-vs.-400g-sr4.2 ; QSFPTEK https://www.qsfptek.com/product/102705.html ; FiberMall https://www.fibermall.com/blog/800g-400g-breakout-guide.htm ; FiberStamp https://www.fiberstamp.com/datasheets/400g-qsfp-dd-2x-200g-qsfp56-aoc.pdf ; AscentOptics https://ascentoptics.com/blog/800g-osfp-transceiver-guide/

**Competitor (cross-check only)**
- FS.com FHD MTP-12/24 Cassettes Datasheet — https://resource.fs.com/mall/doc/20230823172720ptjp3f.pdf
- FS.com "Understanding Fiber Polarity" — https://img-en.fs.com/file/white_paper/understanding-fiber-polarity.pdf
- FS.com TIA-568.3-E overview — https://community.fs.com/blog/tia5683e.html
- Leviton, "Fiber Optic Polarity 101" — https://leviton.com/support/literature/blogs/fiber-optic-polarity-101-b-polarity
- Leviton universal polarity app note — https://leviton.com/content/dam/leviton/network-solutions/product_documents/application_note/Leviton_AppNote_UniversalPolarityIn12FDuplexApplications.pdf
- CommScope standards blog — https://www.commscope.com/blog/2023/standards-updates-for-optical-fiber-what-you-need-to-know/
- Siemon, "ANSI/TIA-568.3-E Introduces New Polarity Methods" — https://www.siemon.com/en/ansi-tia-introduces-new-polarity-methods/
- Panduit-sourced "Fiber Polarity in MPO/Cassette Systems" — https://metrosalessolutions.com/resources/
