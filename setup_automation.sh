#!/bin/bash

# Setup background automation script for macOS launchd daemon
# This script configures a plist agent that runs sync_and_alert.py every 6 hours

# Get the current directory (absolute path)
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PLIST_NAME="com.antigravity.ipotracker.plist"
PLIST_PATH="$HOME/Library/LaunchAgents/$PLIST_NAME"

echo "=== Setting up Antigravity IPO Tracker launchd Agent ==="
echo "Workspace Directory: $DIR"

# Create standard logs directory inside workspace
mkdir -p "$DIR/logs"

# Generate plist dynamically substituting current working directory
cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.antigravity.ipotracker</string>
    
    <key>ProgramArguments</key>
    <array>
        <string>$DIR/.venv/bin/python</string>
        <string>$DIR/sync_and_alert.py</string>
    </array>
    
    <key>WorkingDirectory</key>
    <string>$DIR</string>
    
    <key>RunAtLoad</key>
    <true/>
    
    <key>StartInterval</key>
    <integer>21600</integer> <!-- Run every 6 hours (21600 seconds) -->
    
    <key>StandardOutPath</key>
    <string>$DIR/logs/automation.log</string>
    
    <key>StandardErrorPath</key>
    <string>$DIR/logs/automation_error.log</string>
</dict>
</plist>
EOF

# Correct permissions
chmod 644 "$PLIST_PATH"

# Unload agent if it was already loaded
launchctl unload "$PLIST_PATH" 2>/dev/null

# Load/Start the agent
launchctl load "$PLIST_PATH"

echo "Success! LaunchAgent installed at: $PLIST_PATH"
echo "To check background job status: launchctl list | grep ipotracker"
echo "Logs will be recorded in: $DIR/logs/"
echo "========================================================"
