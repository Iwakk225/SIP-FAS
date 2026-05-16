from pathlib import Path
files = [
    Path(r'C:\EL UKK\Web\SIP-FAS\resources\js\components\admin\components\pages\DataPetugasPage.jsx'),
    Path(r'C:\EL UKK\Web\SIP-FAS\resources\js\components\admin\components\modals\DetailLaporanModal.jsx'),
    Path(r'C:\EL UKK\Web\SIP-FAS\resources\js\components\admin\components\modals\UploadBuktiModal.jsx'),
]
for p in files:
    text = p.read_text(encoding='utf-8')
    lines = text.splitlines()
    new_lines = []
    skipping = False
    paren_depth = 0
    for line in lines:
        if not skipping and 'console.log(' in line:
            skipping = True
            paren_depth = line.count('(') - line.count(')')
            if paren_depth <= 0 and line.strip().endswith(');'):
                skipping = False
            continue
        if skipping:
            paren_depth += line.count('(') - line.count(')')
            if paren_depth <= 0 and ');' in line:
                skipping = False
            continue
        new_lines.append(line)
    out = '\n'.join(new_lines)
    if text.endswith('\n'):
        out += '\n'
    p.write_text(out, encoding='utf-8')
    print('Cleaned', p)
