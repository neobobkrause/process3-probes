#!/bin/sh
# Run by the administrator on a NEW owner-controlled Linux VM, never Codex Cloud.
# No cloud purchase, OAuth, grant edits, repo merges, or service start is implicit.
set -eu
[ "$(id -u)" = 0 ] || { echo 'Run as the VM administrator.' >&2; exit 1; }
source_dir=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
command -v codex >/dev/null
command -v bwrap >/dev/null
python3 -c 'import cryptography'
id process4-host >/dev/null 2>&1 || useradd --system --create-home --home-dir /var/lib/process4-home --shell /usr/sbin/nologin process4-host
install -d -m 0755 /srv/process4/host
# Installed host software is root-owned and is never mounted writable to jobs.
cp -R "$source_dir/bootstrap" /srv/process4/host/
chown -R root:root /srv/process4/host
chmod -R go-w /srv/process4/host
chmod 0755 /srv/process4/host/bootstrap/executor_main.py
install -d -o process4-host -g process4-host -m 0700 /var/lib/process4 /var/lib/process4/private /var/lib/process4-auth
install -d -o root -g process4-host -m 0750 /etc/process4
install -m 0644 "$source_dir/bootstrap/service/process4.service" /etc/systemd/system/process4.service
install -m 0644 "$source_dir/bootstrap/service/process4-auth.service" /etc/systemd/system/process4-auth.service
if [ ! -e /etc/process4/host.env ]; then
 install -o root -g process4-host -m 0640 "$source_dir/bootstrap/service/host.env.example" /etc/process4/host.env
fi
systemctl daemon-reload
printf '%s\n' 'Host files installed; no services started. Complete the documented host preflight, GitHub scope, pinned grants, model selection and one-time SIWC enrollment first.'
