import vendaclara.ui.JanelaPrincipal;

import javax.imageio.ImageIO;
import javax.swing.SwingUtilities;
import javax.swing.UIManager;
import java.awt.AWTException;
import java.awt.Rectangle;
import java.awt.Robot;
import java.awt.image.BufferedImage;
import java.io.File;

public class CapturarPrint {
    public static void main(String[] args) throws Exception {
        UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());

        JanelaPrincipal[] janelaRef = new JanelaPrincipal[1];
        SwingUtilities.invokeAndWait(() -> {
            JanelaPrincipal janela = new JanelaPrincipal();
            janela.setSize(1440, 900);
            janela.setLocation(60, 60);
            janela.setAlwaysOnTop(true);
            janela.setVisible(true);
            janela.toFront();
            janelaRef[0] = janela;
        });

        Thread.sleep(1200);

        Rectangle bounds = new Rectangle();
        SwingUtilities.invokeAndWait(() -> bounds.setBounds(janelaRef[0].getBounds()));

        Robot robot = new Robot();
        BufferedImage imagem = robot.createScreenCapture(bounds);
        ImageIO.write(imagem, "png", new File(args[0]));

        SwingUtilities.invokeAndWait(() -> {
            janelaRef[0].setAlwaysOnTop(false);
            janelaRef[0].dispose();
        });
        System.exit(0);
    }
}
