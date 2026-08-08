from code_runner.runner import execute


code = """
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {

        Scanner sc = new Scanner(System.in);

        int a = sc.nextInt()
        int b = sc.nextInt();

        System.out.println(a + b);
    }
}
"""


result = execute(
    "java",
    code,
    "5 10"
)

print(result)