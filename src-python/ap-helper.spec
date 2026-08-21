# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

a = Analysis(
    ['./main.py'],
    pathex=['./src-archipelago'],
    binaries=[],
    datas=[('src-archipelago', 'src-archipelago')],
    hiddenimports=[
        # Built-in / standard library overrides
        '__future__',
        'asyncio',

        # Archipelago Deps (some may not be required)
        'bsdiff4',
        'certifi',
        'colorama',
        'cymem',
        'cython',
        'jellyfish',
        'jinja2',
        'orjson',
        'pathspec',
        'platformdirs',
        'pymem',
        'pyshortcuts',
        'yaml',
        'schema',
        'typing_extensions',
        'websockets',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='ap-helper',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
