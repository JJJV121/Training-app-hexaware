import tkinter as tk
import json

def convert():
    text = input_box.get("1.0", tk.END).rstrip("\n")
    escaped = json.dumps(text)[1:-1]

    output_box.delete("1.0", tk.END)
    output_box.insert(tk.END, escaped)

    root.clipboard_clear()
    root.clipboard_append(escaped)
    status.config(text="Copied to clipboard!")

root = tk.Tk()
root.title("Code to Escaped String")

tk.Label(root, text="Paste your code:").pack()

input_box = tk.Text(root, height=15, width=80)
input_box.pack(padx=10, pady=5)

tk.Button(root, text="Convert & Copy", command=convert).pack(pady=5)

tk.Label(root, text="Output:").pack()

output_box = tk.Text(root, height=10, width=80)
output_box.pack(padx=10, pady=5)

status = tk.Label(root, text="")
status.pack()

root.mainloop()