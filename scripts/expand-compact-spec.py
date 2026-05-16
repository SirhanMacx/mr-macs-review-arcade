#!/usr/bin/env python3
"""Expands a compact Python course spec into full build-course.mjs JSON.

A compact spec is a dict with:
  slug, title, courseLabel, subject, grade, kicker, description, exam,
  examTarget, standardSet, shortCode, palette, courseAccent, tokens,
  units: list of {number, title, day, categories: list of {name, clues: list of {value, clue, answer, aliases, explanation}}, final: {category, clue, answer, aliases, explanation}}
  cumulative: same shape as a unit, number "99"

This just wraps json.dump with proper formatting and validation.
"""
import json
import sys
import os

def validate(spec):
    assert 'slug' in spec
    assert 'units' in spec and len(spec['units']) > 0
    for u in spec['units']:
        assert 'number' in u and 'title' in u and 'categories' in u
        assert len(u['categories']) == 5, f"unit {u['number']} needs 5 categories, has {len(u['categories'])}"
        for c in u['categories']:
            assert 'name' in c and 'clues' in c
            assert len(c['clues']) == 5, f"unit {u['number']} cat {c['name']} needs 5 clues, has {len(c['clues'])}"
            for cl in c['clues']:
                assert 'value' in cl and 'clue' in cl and 'answer' in cl
                if 'aliases' not in cl:
                    cl['aliases'] = [cl['answer']]
                if 'explanation' not in cl:
                    cl['explanation'] = f"{cl['answer']}: {cl['clue']}"
        assert 'final' in u
        f = u['final']
        for k in ['category','clue','answer']:
            assert k in f, f"unit {u['number']} final missing {k}"
        if 'aliases' not in f: f['aliases'] = []
        if 'explanation' not in f: f['explanation'] = f"{f['answer']}: {f['clue']}"
    return spec

def write_spec(spec, outpath):
    spec = validate(spec)
    with open(outpath, 'w') as f:
        json.dump(spec, f, ensure_ascii=False)
    print(f"wrote: {outpath}")

if __name__ == '__main__':
    # Invoked with: python3 expand-compact-spec.py <course_module.py>
    # The module must define a `SPEC` variable with the dict.
    mod_path = sys.argv[1]
    mod_dir = os.path.dirname(os.path.abspath(mod_path))
    mod_name = os.path.basename(mod_path).replace('.py','')
    sys.path.insert(0, mod_dir)
    mod = __import__(mod_name)
    out = f"/tmp/build-{mod.SPEC['slug']}.json"
    write_spec(mod.SPEC, out)
